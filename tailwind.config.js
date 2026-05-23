/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          darkBg: '#191919',
          sidebar: '#fbfbfa',
          sidebarDark: '#202020',
          text: '#37352f',
          hover: '#efefe9'
        }
      }
    },
  },
  plugins: [],
}
