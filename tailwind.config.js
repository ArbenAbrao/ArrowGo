/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Enables dark mode support via class
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0D1117",         // Background
          text: "#C9D1D9",       // Primary text
          secondary: "#8B949E",  // Subtle gray text
          accent: "#58A6FF",     // Bright blue (can change to teal if you want)
        },
      },
    },
  },
  plugins: [],
};
