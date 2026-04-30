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
          DEFAULT: "#241a12", // Deep Coffee
          light: "#3a2d24",
          dark: "#1a120b",
        },
        ink: {
          DEFAULT: "#241a12", // Matching Navy for consistency
          light: "#5a4d44",
          muted: "#7a6d64",
        },
        cream: {
          DEFAULT: "#faf8f4",
          warm: "#f5f0e8",
          dark: "#ede7db",
        },
        link: "#8b5e3c",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "sans-serif"],
      },
      keyframes: {
        scan: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [typography],
};

export default config;
