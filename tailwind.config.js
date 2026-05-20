/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lovequest: {
          pink: '#f9a8d4',
          rose: '#fb7185',
          cream: '#fff1f2',
          milk: '#fce7f3',
        },
      },
    },
  },
  plugins: [],
};
