/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#3b82f6",
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
