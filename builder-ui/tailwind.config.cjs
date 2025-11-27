/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Evolution Stables Brand Colors
        evoGold: {
          DEFAULT: '#d4a964',
          50: '#faf8f3',
          100: '#f3ede0',
          200: '#e8c589',
          300: '#d4a964',
          400: '#c49954',
          500: '#b08844',
          600: '#8f6f38',
          700: '#6f552c',
          800: '#4f3c20',
          900: '#2f2414',
        },
      },
      // Catalyst-inspired design tokens
      borderRadius: {
        'catalyst': '0.75rem',
      },
      boxShadow: {
        'catalyst': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'catalyst-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}
