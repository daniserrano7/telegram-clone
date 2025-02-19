import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export const HomePage = () => {
  const isLogged = useAuthStore((state) => state.isLogged);

  if (isLogged) {
    return <Navigate to="/chats" />;
  }

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
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-6 relative">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
              <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold">
                T
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-background-primary/80 backdrop-blur-md -mx-8 -my-3 rounded-2xl" />
              <h1 className="text-3xl font-bold text-font mb-2 relative">
                Welcome to Telegram Clone
              </h1>
              <p className="text-font-subtle relative">
                Connect with friends and start chatting
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-elevation-contrast/95 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/5 backdrop-blur-xl">
            <div className="p-8">
              <div className="flex flex-col gap-4">
                <Link
                  to="/login"
                  className="w-full text-center text-font-primary-contrast bg-primary py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center text-font bg-elevation py-3 px-4 rounded-xl hover:bg-elevation-hover transition-colors font-medium"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-8 pt-6 text-center border-t border-border">
                <p className="text-font-subtle">
                  Built with React, NestJS, and PostgreSQL
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
