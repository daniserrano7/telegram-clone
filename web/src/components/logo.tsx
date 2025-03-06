import cx from 'classix';

export const Logo = ({ size = 'large' }: Props) => {
  return (
    <div
      className={cx(
        'rounded-[2rem] mx-auto mb-6 relative overflow-hidden shadow-xl group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300',
        size === 'large' ? 'w-32 h-32' : 'w-24 h-24'
      )}
    >
      {/* Base radial gradient */}
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,#1a237e_0%,rgba(26,35,126,0.8)_50%,rgba(26,35,126,0.6)_100%)]" />

      {/* Animated blurry gradient background */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
        {/* Main gradient blobs */}
        <div className="absolute inset-0 rounded-[2rem] animate-blob mix-blend-soft-light filter blur-xl opacity-80 bg-[radial-gradient(circle_at_50%_50%,#e3f2fd_0%,#1e88e5_40%,#1565c0_100%)]" />
        <div className="absolute inset-0 rounded-[2rem] animate-blob animation-delay-2000 mix-blend-soft-light filter blur-xl opacity-80 bg-[radial-gradient(circle_at_30%_70%,#e1f5fe_0%,#039be5_60%)]" />
        <div className="absolute inset-0 rounded-[2rem] animate-blob animation-delay-4000 mix-blend-soft-light filter blur-xl opacity-80 bg-[radial-gradient(circle_at_70%_30%,#b3e5fc_0%,#0277bd_70%)]" />
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
        <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_30%_30%,rgba(227,242,253,0.4)_0%,transparent_60%)] animate-pulse" />
        <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,rgba(179,229,252,0.25),transparent_50%)]" />
      </div>

      {/* Glowing border effect */}
      <div className="absolute -inset-0.5 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,#e3f2fd,#1e88e5_50%,#1565c0_100%)] opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl" />

      {/* Logo container with glass effect */}
      <div className="absolute inset-0 rounded-[2rem] flex items-center justify-center backdrop-blur-sm bg-[#1a237e]/10">
        <img
          src="/logo_256.png"
          alt="Telechat"
          className={cx(
            'transform group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl',
            size === 'large' ? 'w-20 h-20' : 'w-14 h-14'
          )}
        />
      </div>
    </div>
  );
};

interface Props {
  size?: 'small' | 'large';
}
