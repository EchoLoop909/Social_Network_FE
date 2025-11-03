/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "insta-primary": "#0095f6",
        "insta-red": "#ed4956",
        "insta-gray": "#dbdbdb",
        "insta-bg-light": "#fafafa",
        "insta-bg-dark": "#121212",
      },
      spacing: {
        18: "4.5rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
