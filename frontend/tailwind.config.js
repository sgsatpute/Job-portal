/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d7f7e9",
          500: "#14b87a",
          600: "#0f9b67",
          700: "#0d7c55",
          900: "#0b2f25",
        },
        ink: "#111827",
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
