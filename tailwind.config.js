/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          pink: '#ff2d55'
        }
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg,#ff2d55,#ff6b6b)'
      }
    }
  },
  plugins: []
};
