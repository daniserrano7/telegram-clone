/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        elevation: {
          DEFAULT: 'var(--color-elevation)',
          hover: 'var(--color-elevation-hover)',
          active: 'var(--color-elevation-active)',
          contrast: 'var(--color-elevation-contrast)',
          sunken: 'var(--color-elevation-sunken)',
        },
        background: {
          primary: 'var(--color-background-primary)',
          hover: 'var(--color-background-primary-hover)',
          active: 'var(--color-background-primary-active)',
        },
        border: 'var(--color-border)',
        font: {
          DEFAULT: 'var(--color-font)',
          primary: {
            DEFAULT: 'var(--color-font-primary)',
            contrast: 'var(--color-font-primary-contrast)',
          },
          subtle: 'var(--color-font-subtle)',
          error: 'var(--color-font-error)',
        },
        icon: {
          DEFAULT: 'var(--color-icon)',
          subtle: 'var(--color-icon-subtle)',
          success: 'var(--color-icon-success)',
          error: 'var(--color-icon-error)',
        },
        input: {
          background: 'var(--color-input-background)',
          'background-hover': 'var(--color-input-background-hover)',
          'background-active': 'var(--color-input-background-active)',
          border: 'var(--color-input-border)',
          'border-hover': 'var(--color-input-border-hover)',
          'border-active': 'var(--color-input-border-active)',
        },
      },
      animation: {
        'message-in': 'message-in 300ms ease-out',
      },
      keyframes: {
        'message-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
