/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0C115B',
        crimson: '#A61E51',
        teal: '#0F766E',
        cream: '#FFFBF7',
      },
      fontFamily: {
        petrona: ['Petrona', 'Georgia', 'serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
