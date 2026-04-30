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
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "#966d09",
          800: "#7a580a",
          900: "#5e4408",
          950: "var(--brand-950)",
        },
        navy: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
          dark: "#1a120b",
        },
        ink: {
          DEFAULT: "var(--ink)",
          light: "var(--ink-light)",
          muted: "var(--ink-muted)",
        },
        cream: {
          DEFAULT: "var(--cream)",
          warm: "var(--cream-warm)",
          dark: "var(--cream-dark)",
        },
        link: "#8b5e3c",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
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
