/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0D0F12',
          900: '#14171C',
          800: '#1E2229',
          700: '#2A2F38',
        },
        paper: {
          50: '#FBFAF6',
          100: '#F6F3EC',
          200: '#EAE4D5',
        },
        brass: {
          400: '#D9B84A',
          500: '#C9A227',
          600: '#A8841C',
        },
        steel: {
          400: '#6B98AC',
          500: '#4C7A92',
          600: '#3A6070',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-4%)' },
          '50%': { transform: 'translateY(104%)' },
          '100%': { transform: 'translateY(-4%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        scan: 'scan 2.4s ease-in-out infinite',
        pulseSoft: 'pulseSoft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
