/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf8',
          100: '#d4f2ec',
          200: '#9ee1d8',
          300: '#60cfc2',
          400: '#2bb5a6',
          500: '#009488',
          600: '#0a7d72',
          700: '#105d55',
          800: '#124745',
          900: '#0f3736',
        },
      },
      boxShadow: {
        soft: '0 20px 80px rgba(15, 23, 42, 0.12)',
        glow: '0 0 40px rgba(34, 211, 238, 0.14)',
      },
      dropShadow: {
        soft: '0 10px 20px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
