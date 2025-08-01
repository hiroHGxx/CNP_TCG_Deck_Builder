/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cnp: {
          red: '#ef4444',
          blue: '#3b82f6',
          green: '#10b981',
          yellow: '#f59e0b',
          gray: '#6b7280',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.2s ease-out',
        'slide-in-down': 'slideInDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(-100%) translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(-100%) translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(0) translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0) translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}