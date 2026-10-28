/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      colors: {
        wall: {
          bg: '#0f1419',
          card: '#1a2332',
          accent: '#3b82f6',
          muted: '#64748b',
        },
      },
    },
  },
  plugins: [],
};
