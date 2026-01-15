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
          '100%': { transform: 'translateX(-33.333%)' },
        },
      },
      animation: {
        'infinite-scroll': 'infinite-scroll 10s linear infinite',
      },
    },
  },
  plugins: [],
}
