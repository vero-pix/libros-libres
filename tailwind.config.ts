import type { Config } from "tailwindcss";

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
          50: "#fef9ee",
          100: "#fdf0d3",
          200: "#fadea6",
          300: "#f7c56e",
          400: "#f3a433",
          500: "#f0890f",
          600: "#e16e08",
          700: "#bb530a",
          800: "#954110",
          900: "#793710",
          950: "#411a06",
        },
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
  plugins: [],
};

export default config;
