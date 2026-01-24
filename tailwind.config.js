/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff3dfc",
        "primary-strong": "#ff6bff",
        accent: "#14f1ff",
        "accent-strong": "#38fdfc",
        surface: "rgba(10, 12, 28, 0.72)",
        muted: "#8ab7d4",
      },
      animation: {
        "star-pulse": "star-pulse 1.5s ease-in-out infinite",
        "bounce-in": "bounce-in 0.4s ease-out",
      },
      boxShadow: {
        card: "0 20px 50px rgba(4, 12, 45, 0.6)",
        soft: "0 24px 58px rgba(255, 61, 252, 0.2)",
        focus: "0 0 0 4px rgba(20, 241, 255, 0.45)",
      },
    },
  },
  plugins: [],
}
