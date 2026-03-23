/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./*.html", "./assets/css/**/*.css", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#9e8976",
        "primary-dark": "#7d6b5d",
        secondary: "#a69080",
        accent: "#d4c7b8",
        "accent-dark": "#8b7e74",
        "background-light": "#fbf8f1",
        "background-dark": "#f5f1eb",
        charcoal: "#fbf8f1",
        ink: "#3f3b34",
        muted: "#716a61",
        border: "#e8dfd3",
        card: "#fbf8f1",
        slate: colors.slate,
        stone: colors.stone,
        white: colors.white,
        black: colors.black,
      },
      fontFamily: {
        display: ["Newsreader", "serif"],
        serif: ["Playfair Display", "Newsreader", "serif"],
        sans: ["Inter", "Public Sans", "system-ui", "sans-serif"],
        body: ["Public Sans", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        warm: "0 10px 30px rgba(158, 137, 118, 0.08)",
        panel: "0 24px 60px rgba(111, 98, 89, 0.12)",
      },
      letterSpacing: {
        brand: "0.18em",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
