/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ffe785',
          light: '#ffd94d',
          50: '#ffefba',
          100: '#fff3ee',
        },
        action: {
          DEFAULT: '#027fff',
          light: '#0d6efd',
          50: '#e8f4ff',
          100: '#c7e2ff',
        },
        // DESIGN.md "Warm Minimalism" palette
        canvas: '#FECEA1',
        charcoal: {
          DEFAULT: '#2A363B',
          dark: '#1A2328',
          deep: '#0C1A1E',
        },
        coral: {
          DEFAULT: '#F5847C',
          hover: '#E8736B',
        },
        warm: {
          50: '#FFF8F5',
          100: '#F9F3EE',
          200: '#F5ECE7',
        },
      },
      fontFamily: {
        sans: ["Montserrat", "'Helvetica Neue'", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: 'rgba(0,0,0,0.08) 0px 4px 10px 0px',
        ambient: 'rgba(42,54,59,0.12) 0px 12px 32px 0px',
        warm: 'rgba(245,132,124,0.25) 0px 8px 24px 0px',
      },
      keyframes: {
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.2s ease-out',
        'fade-up': 'fade-up 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
