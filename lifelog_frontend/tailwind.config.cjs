/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Manrope'", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#111827",
          dark: "#0b1220",
          light: "#e5e7eb",
        },
      },
      boxShadow: {
        card: "0 12px 32px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
};
