export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mint: "#2dd4bf",
        coral: "#fb7185",
        lemon: "#facc15"
      },
      boxShadow: {
        panel: "0 18px 48px rgba(15, 23, 42, 0.14)"
      }
    }
  },
  plugins: []
};
