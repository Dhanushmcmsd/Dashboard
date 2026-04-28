import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F1117",
        surface: "#1A1D27",
        border: "#2A2D3A",
        primary: "#4F6EF7",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-main": "#F1F5F9",
        "text-muted": "#94A3B8",
        branch: {
          supermarket: "#4F6EF7",
          "gold-loan": "#F59E0B",
          "ml-loan": "#10B981",
          "vehicle-loan": "#EC4899",
          "personal-loan": "#8B5CF6"
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"]
      }
    }
  },
  plugins: []
};
export default config;
