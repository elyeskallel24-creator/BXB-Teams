/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#FF6B00',
          primaryHover: '#E65F00',
          accent: '#BF4A00',
        },
        surface: {
          light: '#FFF8F3',
          cardLight: '#FFFFFF',
          borderLight: '#EAEAEA',
          dark: '#0A0A0A',
          cardDark: '#141414',
          borderDark: '#262626',
        },
        text: {
          primaryLight: '#0A0A0A',
          secondaryLight: '#6B7280',
          primaryDark: '#FFFFFF',
          secondaryDark: '#9CA3AF',
        }
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
