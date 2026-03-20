/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "background-dark": "var(--color-background-dark)",
        "background-light": "var(--color-background-light)",
        charcoal: "var(--color-charcoal)",
        accent: "var(--color-accent)",
        slate: colors.slate,
        stone: colors.stone,
        white: colors.white,
        black: colors.black,
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        serif: ["var(--font-serif)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};
