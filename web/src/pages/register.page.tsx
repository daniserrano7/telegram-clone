import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export const RegisterPage = () => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    setError('');
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      await register({ email, username, password });

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
    <main className="w-full h-full bg-background-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 bg-primary/5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-primary) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative w-full h-full flex flex-col items-center overflow-y-auto py-8">
        <div className="w-full max-w-md px-4">
          {/* Logo/Brand */}
          <div className="text-center mb-6 relative">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
              <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
                T
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-2 backdrop-blur-md -mx-8 -my-3 rounded-2xl" />
              <h1 className="text-3xl font-bold text-font mb-2 relative">
                Create Account
              </h1>
              <p className="text-font-subtle relative">
                Join our community today
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-elevation-contrast/95 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/5 backdrop-blur-xl mb-8">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-font"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Enter your email"
                  />
                </div>

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
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Choose a username"
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
                    name="password"
                    type="password"
                    required
                    className="w-full bg-elevation py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-font placeholder-font-subtle/50 transition-shadow"
                    placeholder="Create a password"
                  />
                </div>

                {error && (
                  <div className="bg-font-error/10 text-font-error text-sm rounded-lg p-3">
                    {error}
                  </div>
                )}

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
