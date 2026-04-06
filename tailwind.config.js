/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#0F1623',
          hover: '#1A2438',
          active: '#1E3A5F',
          border: '#1E2D45',
          text: '#8BA3C7',
          textActive: '#E2EEFF',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#1D6FCA',
          600: '#1558A8',
          700: '#0F3F7E',
          900: '#0A2547',
        },
        surface: {
          0: '#FFFFFF',
          1: '#F8FAFC',
          2: '#F1F5F9',
          3: '#E2E8F0',
        },
        danger: '#DC2626',
        success: '#16A34A',
        warning: '#D97706',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.04)',
        modal: '0 20px 60px -10px rgba(0,0,0,.18)',
      }
    },
  },
  plugins: [],
}
