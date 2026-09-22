/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          squid: "#232F3E",
          orange: "#FF9900",
          blue: "#0073BB",
          light: "#F2F3F3",
          dark: "#0F141C",
        }
      }
    },
  },
  plugins: [],
}
