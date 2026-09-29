/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chaitanya: {
          blue: '#0B2545',
          navy: '#134074',
          lightBlue: '#EEF4F8',
          red: '#C8102E',
          darkRed: '#9A0B22',
          gold: '#D4AF37',
          yellow: '#F4A261',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          textDark: '#0F172A',
          textMuted: '#475569'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
