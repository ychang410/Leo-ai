/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#FAFAF9',
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
}

