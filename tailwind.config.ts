import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        border: {
          DEFAULT: "#1A1A1A",
          hover: "#2A2A2A",
        },
        text: {
          primary: "#FAFAFA",
          secondary: "#BFBFBF",
          muted: "#888888",
          dim: "#555555",
        },
        accent: {
          DEFAULT: "#4A9EFF",
          hover: "#6BB3FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      spacing: {
        "section": "10rem",
        "section-sm": "5rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(74, 158, 255, 0.2)",
        "glow": "0 0 20px rgba(74, 158, 255, 0.25), 0 0 40px rgba(74, 158, 255, 0.1)",
        "glow-lg": "0 0 30px rgba(74, 158, 255, 0.3), 0 0 60px rgba(74, 158, 255, 0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
