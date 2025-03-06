import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Logo } from 'src/components/logo';

export const HomePage = () => {
  const isLogged = useAuthStore((state) => state.isLogged);

  if (isLogged) {
    return <Navigate to="/chats" />;
  }

  return (
    <main className="w-full h-full relative overflow-hidden bg-slate-100">
      {/* Content */}
      <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-6 relative">
            {/* Title section with improved backdrop */}
            <div className="relative">
              <div className="mb-6">
                <Logo />
              </div>
              <h1 className="text-3xl font-bold text-font mb-2 relative">
                Welcome to Telechat
              </h1>
              <p className="text-font-subtle relative">
                Connect with friends and start chatting
              </p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-elevation-contrast rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/5 backdrop-blur-xl">
            <div className="p-6">
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

              <div className="mt-8 pt-4 text-center border-t border-border">
                <p className="text-font-subtle">
                  Built with ❤️ by{' '}
                  <a
                    href="https://github.com/daniserrano7"
                    className="text-font-primary"
                  >
                    @daniserrano7
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
