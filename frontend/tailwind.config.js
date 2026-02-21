/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2588FF',
          hover: '#1e6fd9',
        },
      },
      maxWidth: {
        '1140': '1140px',
        '1200': '1200px',
      },
      screens: {
        'xs': '475px',
      },
      fontSize: {
        'heading1': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.03em' }],
        'heading2': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading3': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.3', fontWeight: '600' }],
        'heading4': ['clamp(1.25rem, 2vw, 1.5rem)', { lineHeight: '1.4', fontWeight: '600' }],
      },
      keyframes: {
        'infinite-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-25%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'infinite-scroll': 'infinite-scroll 6.67s linear infinite',
        'float': 'float 8s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, rgb(0 0 0 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 0.03) 1px, transparent 1px)',
        'dot-pattern': 'radial-gradient(circle, rgb(0 0 0 / 0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
        'dots': '24px 24px',
      },
    },
  },
  plugins: [],
}
