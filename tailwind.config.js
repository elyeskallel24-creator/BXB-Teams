/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#FF6B00',
          primaryHover: '#E65F00',
          primarySoft: 'rgba(255, 107, 0, 0.12)',
          primaryGlow: 'rgba(255, 107, 0, 0.28)',
          accent: '#BF4A00',
        },
        surface: {
          light: '#F7F7F8',
          cardLight: '#FFFFFF',
          elevatedLight: '#FFFFFF',
          hoverLight: '#F0F0F2',
          borderLight: 'rgba(0, 0, 0, 0.08)',
          dark: '#0A0A0C',
          cardDark: '#16161B',
          elevatedDark: '#1D1D23',
          hoverDark: '#25252C',
          borderDark: 'rgba(255, 255, 255, 0.08)',
        },
        text: {
          primaryLight: '#171719',
          secondaryLight: '#62626B',
          mutedLight: '#898991',
          primaryDark: '#F7F7F8',
          secondaryDark: '#A1A1AA',
          mutedDark: '#71717A',
        },
        state: {
          success: '#22C55E',
          successSoft: 'rgba(34, 197, 94, 0.12)',
          danger: '#EF4444',
          dangerSoft: 'rgba(239, 68, 68, 0.12)',
          warning: '#F59E0B',
          warningSoft: 'rgba(245, 158, 11, 0.12)',
          info: '#3B82F6',
          infoSoft: 'rgba(59, 130, 246, 0.12)',
        },
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'softDark': '0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px -2px rgba(0, 0, 0, 0.25)',
        'float': '0 12px 40px -10px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'floatDark': '0 12px 40px -10px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 0 1px rgba(255, 107, 0, 0.28), 0 0 20px -4px rgba(255, 107, 0, 0.35)',
        'glowSoft': '0 0 0 1px rgba(255, 107, 0, 0.18)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'swift': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      letterSpacing: {
        'tighter': '-0.02em',
      },
    },
  },
  plugins: [],
}
