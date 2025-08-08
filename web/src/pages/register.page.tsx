import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Logo } from 'src/components/logo';

export const RegisterPage = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLogged = useAuthStore((state) => state.isLogged);

  const validateUsername = (value: string): boolean => {
    if (value.length < 3 || value.length > 30) {
      setUsernameError('Username must be between 3 and 30 characters');
      return false;
    }

    if (!/^[a-zA-Z]/.test(value)) {
      setUsernameError('Username must start with a letter');
      return false;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(value)) {
      setUsernameError(
        'Username can only contain letters, numbers, underscores (_), and dots (.)'
      );
      return false;
    }

    setUsernameError('');
    return true;
  };

  if (isLogged) {
    return <Navigate to="/chats" />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateUsername(username)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      await register({ username, password, confirmPassword });

      setError('');
      navigate('/chats');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'An error occurred';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full h-full relative overflow-hidden">
      <div className="relative w-full h-full flex flex-col items-center overflow-y-auto py-8">
        <div className="w-full max-w-md px-4">
          {/* Logo/Brand */}
          <div className="text-center mb-6 relative">
            <Logo size="small" />

            {/* Title section with improved backdrop */}
            <div className="relative">
              <h1 className="text-3xl font-bold text-font mb-2 relative">
                Create Account
              </h1>
              <p className="text-font-subtle relative">
                Join our community today
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-elevation-contrast rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border backdrop-blur-xl mb-8">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-font"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsername(value);
                      validateUsername(value);
                    }}
                    className={`w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-ligth text-font placeholder-font-subtle/50 transition-shadow ${
                      usernameError ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="Choose a username"
                  />
                  {usernameError && (
                    <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-font"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-ligth text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Create a password"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-font"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-ligth text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Confirm your password"
                  />
                  {error && (
                    <div className="bg-font-error/10 text-font-error text-sm rounded-lg pl-2">
                      {error}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="mt-2 text-font-primary-contrast bg-primary py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 text-center border-t border-border">
                <p className="text-font-subtle">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
