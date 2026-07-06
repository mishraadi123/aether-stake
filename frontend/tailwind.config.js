/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          light: '#FAF8F2',
          DEFAULT: '#F6F4EB',
        },
        charcoal: {
          light: '#33322E',
          DEFAULT: '#1C1B18',
        },
        coral: {
          DEFAULT: '#FF5E1A',
          hover: '#E04E10',
        },
        forest: {
          DEFAULT: '#378E56',
        },
        sand: {
          DEFAULT: '#E6E3D8',
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-body)', 'Outfit', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulseSlow 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    },
  },
  plugins: [],
};
