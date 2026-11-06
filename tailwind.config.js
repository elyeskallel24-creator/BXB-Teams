/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B00',
          secondary: '#0A0A0A',
          accent: '#BF4A00',
          bgLight: '#FFF8F3',
          cardLight: '#FFFFFF',
          borderLight: '#E5E5E5',
          bgDark: '#0A0A0A',
          cardDark: '#141414',
          borderDark: '#2A2A2A',
        }
      },
    },
  },
  plugins: [],
}
