import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0D1117",
        surface: "#111827",
        elevated: "#1C2A3E",
        border: "#1E2D42",
        primary: "#1D4ED8",
        "primary-hover": "#2563EB",
        accent: "#C8102E",
        "accent-dim": "#9B0B21",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#C8102E",
        "text-primary": "#E2E8F0",
        "text-muted": "#64748B",
        sidebar: "#0D1117",
        // Supra Pacific brand palette
        "supra-blue":  "#1D4ED8",
        "supra-navy":  "#0D1117",
        "supra-red":   "#C8102E",
        branch: {
          supermarket:    "#1D4ED8",
          "gold-loan":    "#D97706",
          "mf-loan":      "#16A34A",
          "vehicle-loan": "#C8102E",
          "personal-loan":"#7C3AED",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        data: ["var(--font-data)", "monospace"],
      },
      boxShadow: {
        card:        "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":"0 8px 32px rgba(0,0,0,0.5)",
        "red-glow":  "0 0 20px rgba(200,16,46,0.15)",
        "blue-glow": "0 0 20px rgba(29,78,216,0.15)",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      borderColor: {
        DEFAULT: "#1E2D42",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
