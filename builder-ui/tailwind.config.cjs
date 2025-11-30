/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // The Financial Palette
        fin: {
          bg: '#ffffff',          // Pure white surfaces
          surface: '#f8fafc',     // Slate-50 (App background)
          border: '#e2e8f0',      // Slate-200 (Subtle borders)
          text: '#0f172a',        // Slate-900 (High contrast text)
          muted: '#64748b',       // Slate-500 (Secondary text)
          primary: '#059669',     // Emerald-600 (Primary Action/Success)
          primaryHover: '#047857',// Emerald-700
          danger: '#ef4444',      // Red-500
        },
        // Evolution Brand (Keep purely for logos/headers)
        evo: {
          gold: '#d4a964',
        },
        // Legacy Evolution Stables Brand Colors (kept for backwards compatibility)
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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'catalyst': '0.75rem',
      },
      boxShadow: {
        'financial': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'catalyst': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'catalyst-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
