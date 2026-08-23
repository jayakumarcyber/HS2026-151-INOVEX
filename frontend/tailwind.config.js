/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07110C', // Dark Background
          900: '#0B1711', // Main Surface
          850: '#101F17', // Secondary Surface
          800: '#14271D',
          750: '#1C3326', // Border
        },
        emerald: {
          400: '#22C55E', // Light Accent / Success
          500: '#16A34A', // Primary
          600: '#15803D', // Primary Hover
          700: '#166534',
        },
        slate: {
          100: '#F5F7F6', // Primary Text
          300: '#A7B3AC', // Secondary Text
          400: '#738078', // Muted Text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
