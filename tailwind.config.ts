import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background:      "#f7fff0",
        surface:         "#ffffff",
        elevated:        "#f0fce8",
        border:          "#c8e6c0",
        primary:         "#064734",
        "primary-hover": "#0a5c43",
        accent:          "#E0FFC2",
        "accent-dim":    "#d4f5a8",
        success:         "#064734",
        warning:         "#b45309",
        danger:          "#991b1b",
        "text-primary":  "#064734",
        "text-muted":    "#4a7c5f",
        sidebar:         "#ffffff",
        // Supra Pacific brand palette
        "supra-green":   "#064734",
        "supra-mint":    "#E0FFC2",
        "supra-red":     "#991b1b",
        branch: {
          supermarket:     "#064734",
          "gold-loan":     "#b45309",
          "mf-loan":       "#0a5c43",
          "vehicle-loan":  "#991b1b",
          "personal-loan": "#4a7c5f",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        data: ["var(--font-data)", "monospace"],
      },
      boxShadow: {
        card:           "0 2px 12px rgba(6,71,52,0.07)",
        "card-hover":   "0 6px 24px rgba(6,71,52,0.12)",
        "green-glow":   "0 0 20px rgba(6,71,52,0.15)",
        "mint-glow":    "0 0 20px rgba(224,255,194,0.6)",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      borderColor: {
        DEFAULT: "#c8e6c0",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "bar-grow":   "bar-grow 0.35s ease-out forwards",
      },
      keyframes: {
        "bar-grow": {
          "from": { transform: "scaleY(0)", opacity: "0" },
          "to":   { transform: "scaleY(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
