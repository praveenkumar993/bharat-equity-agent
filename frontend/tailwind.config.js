/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: '#00C896', dim: '#00C89615' },
        red: { DEFAULT: '#FF4D4D', dim: '#FF4D4D15' },
        amber: { DEFAULT: '#F5A623', dim: '#F5A62315' },
        card: '#141B2D',
        border: '#1E2A40',
        primary: '#0A0E1A',
        secondary: '#0F1524',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}