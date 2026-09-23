/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      keyframes: {

        scan: {
          "0%": {
            transform: "translateY(-200px)",
          },

          "100%": {
            transform: "translateY(500px)",
          },
        },

        temper: {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0.5",
          },

          "50%": {
            transform: "scale(1)",
            opacity: "1",
          },

          "100%": {
            transform: "scale(0.95)",
            opacity: "0.5",
          },
        },

        shine: {
          "0%": {
            transform: "translateX(-300px) rotate(12deg)",
          },

          "100%": {
            transform: "translateX(600px) rotate(12deg)",
          },
        },

      },

      animation: {

        scan:
          "scan 2s linear infinite",

        temper:
          "temper 1.5s ease-in-out infinite",

        shine:
          "shine 2.5s linear infinite",

      },

    },
  },

  plugins: [],
};