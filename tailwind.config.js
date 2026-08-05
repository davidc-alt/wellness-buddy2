/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1E293B',
          navy: '#2F4858',
          teal: '#4E878C',
          green: '#3B7A72',
          mint: '#5E9C8D',
          lightMint: '#E3ECE9',
          bg: '#F4F6F8',
          card: '#FFFFFF',
          accent: '#E76F51',
          coral: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
