/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        agri: {
          green: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#1B5E20', // Kisan Hit Primary Emerald
            950: '#0F3D14',
          },
          harvest: {
            400: '#FBBF24',
            500: '#F59E0B', // Golden Wheat / Mustard Yellow
            600: '#D97706',
          },
          earth: {
            800: '#92400E',
            900: '#78350F', // Earthen Soil
          },
          surface: {
            light: '#F8FAF5', // Warm parchment off-white
            card: '#FFFFFF',
            darkBg: '#0D1F12', // Deep forest night
            darkCard: '#132A1B', // Dark moss slate
            darkBorder: '#1F3F28',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 25px -5px rgba(27, 94, 32, 0.1), 0 8px 10px -6px rgba(27, 94, 32, 0.05)',
      },
    },
  },
  plugins: [],
};

