import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fefcf5",
          100: "#fdf5e0",
          200: "#fbe8b8",
          300: "#f8d98a",
          400: "#f0c040",
          500: "#d4a017",
          600: "#b8860b",
          700: "#966d09",
          800: "#7a580a",
          900: "#5e4408",
          950: "#3a2a05",
        },
        navy: {
          DEFAULT: "#2d3436",
          light: "#3d4749",
          dark: "#1e2324",
        },
        link: "#2b6cb0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        scan: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
