import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Logo } from 'src/components/logo';

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLogged = useAuthStore((state) => state.isLogged);

  if (isLogged) {
    return <Navigate to="/chats" />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      setIsLoading(true);
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const username = (formData.get('username') as string).trim();
      const password = (formData.get('password') as string).trim();
      await login({ username, password });

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
    <main className="w-full h-full bg-background-primary relative overflow-hidden bg-slate-100">
      {/* Content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md px-4">
          {/* Logo/Brand */}
          <div className="text-center mb-6 relative">
            <Logo size="small" />
            <div className="relative">
              <h1 className="text-3xl font-bold text-font mb-2 relative">
                Welcome back
              </h1>
              <p className="text-font-subtle relative">
                Login to your account to continue
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-elevation-contrast rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border backdrop-blur-xl">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-font"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Enter your username"
                  />
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
                    type="password"
                    name="password"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Enter your password"
                  />
                  {error && (
                    <div className="bg-font-error/10 text-font-error text-sm rounded-lg pl-2">
                      {error}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="text-font-primary-contrast bg-primary py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
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
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 text-center border-t border-border">
                <p className="text-font-subtle">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Register
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
