import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0C",
        surface: "#111116",
        elevated: "#18181F",
        border: "#2A2A35",
        primary: "#2563EB",
        "primary-hover": "#3B82F6",
        accent: "#DC2626",
        "accent-dim": "#991B1B",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        "text-primary": "#E2E8F0",
        "text-muted": "#64748B",
        sidebar: "#0D0D12",
        branch: {
          supermarket: "#2563EB",
          "gold-loan": "#D97706",
          "mf-loan": "#16A34A",
          "vehicle-loan": "#DC2626",
          "personal-loan": "#7C3AED",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.5)",
        "red-glow": "0 0 20px rgba(220,38,38,0.15)",
        "blue-glow": "0 0 20px rgba(37,99,235,0.15)",
      },
      borderColor: {
        DEFAULT: "#2A2A35",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
