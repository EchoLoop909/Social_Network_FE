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
        // Vela admin dashboard tokens
        "vela-bg": "#F2F1EC",
        "vela-panel": "#12151A",
        "vela-border": "#E1DFD6",
        "vela-brand": "#3E6259",
        "vela-success": "#3F7A5C",
        "vela-warning": "#C98A2C",
        "vela-danger": "#B8433A",
        "vela-neutral": "#6B7280",
      },
      spacing: {
        18: "4.5rem",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
