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
      // Los colores salen de `rgb(var(--x-rgb) / <alpha-value>)` y no de
      // `var(--x)` directo: con el hex dentro de la variable, Tailwind no podía
      // generar las variantes con opacidad y clases como `text-cream/80` o
      // `border-cream-dark/30` no existían en el CSS compilado — cientos de
      // usos en el sitio no hacían nada. (08-09-2026)
      colors: {
        brand: {
          50: "#fefcf5",
          100: "#fdf5e0",
          200: "#fbe8b8",
          300: "#f8d98a",
          400: "#f0c040",
          500: "rgb(var(--brand-500-rgb) / <alpha-value>)",
          600: "rgb(var(--brand-600-rgb) / <alpha-value>)",
          700: "#966d09",
          800: "#7a580a",
          900: "#5e4408",
          950: "rgb(var(--brand-950-rgb) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-rgb) / <alpha-value>)",
          deep: "rgb(var(--gold-deep-rgb) / <alpha-value>)",
        },
        navy: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          light: "rgb(var(--ink-light-rgb) / <alpha-value>)",
          dark: "#1a120b",
        },
        ink: {
          DEFAULT: "rgb(var(--ink-rgb) / <alpha-value>)",
          deep: "rgb(var(--ink-deep-rgb) / <alpha-value>)",
          night: "rgb(var(--ink-night-rgb) / <alpha-value>)",
          light: "rgb(var(--ink-light-rgb) / <alpha-value>)",
          muted: "rgb(var(--ink-muted-rgb) / <alpha-value>)",
        },
        coral: {
          DEFAULT: "rgb(var(--coral-rgb) / <alpha-value>)",
          deep: "rgb(var(--coral-deep-rgb) / <alpha-value>)",
        },
        green: {
          DEFAULT: "rgb(var(--green-rgb) / <alpha-value>)",
          deep: "rgb(var(--green-deep-rgb) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--paper-rgb) / <alpha-value>)",
          2: "rgb(var(--paper-2-rgb) / <alpha-value>)",
          card: "rgb(var(--paper-card-rgb) / <alpha-value>)",
          edge: "rgb(var(--paper-edge-rgb) / <alpha-value>)",
        },
        cream: {
          DEFAULT: "rgb(var(--cream-rgb) / <alpha-value>)",
          warm: "rgb(var(--cream-warm-rgb) / <alpha-value>)",
          dark: "rgb(var(--cream-dark-rgb) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--line-rgb) / <alpha-value>)",
          strong: "rgb(var(--line-strong-rgb) / <alpha-value>)",
        },
        link: "#8b5e3c",
        "black-soft": "#33302b",
      },
      fontFamily: {
        display: ["var(--font-newsreader)", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        book: "0 2px 2px rgba(23,20,16,.04), 0 12px 22px -10px rgba(23,20,16,.30), 0 30px 50px -28px rgba(23,20,16,.34)",
        card: "0 1px 2px rgba(23,20,16,.04), 0 14px 30px -18px rgba(23,20,16,.22)",
      },
      // Las animaciones de entrada se definen todas acá. Antes se usaban clases
      // de `tailwindcss-animate` (`animate-in fade-in slide-in-from-bottom-4`,
      // `animate-shake`, `animate-fade-in`, `animate-fade-up`) sin tener el
      // plugin instalado: no existian en el CSS compilado y no hacian nada.
      // El error del checkout, por ejemplo, nunca se sacudio. (10-09-2026)
      keyframes: {
        scan: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "zoom-in": {
          "0%": { opacity: "0", transform: "scale(.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up-full": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        // alias de fade-in-up: el sitio usa los dos nombres
        "fade-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "zoom-in": "zoom-in 0.5s ease-out forwards",
        "slide-up-full": "slide-up-full 0.3s ease-out forwards",
        // el destello del escaner: se apaga solo, no se queda blanco
        "fade-out": "fade-out 0.3s ease-out forwards",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
