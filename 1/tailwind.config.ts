import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#fffbf5",
          100: "#fef3e2",
          200: "#fde4bc",
          300: "#f9c97a",
          400: "#f5a623",
          500: "#e8870e",
          600: "#cc6609",
          accent: "#e8870e",
          glass: "rgba(255, 251, 245, 0.55)",
          border: "rgba(255, 255, 255, 0.45)",
        },
        cold: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0c4a6e",
          800: "#0f172a",
          900: "#0a0f1a",
          accent: "#38bdf8",
          glass: "rgba(15, 23, 42, 0.45)",
          border: "rgba(56, 189, 248, 0.12)",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
        },
      },
      backgroundImage: {
        "warm-mesh":
          "radial-gradient(ellipse at 15% 0%, rgba(139, 92, 246, 0.18) 0%, transparent 45%), radial-gradient(ellipse at 85% 20%, rgba(244, 63, 94, 0.12) 0%, transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(245, 166, 35, 0.2) 0%, transparent 50%), linear-gradient(180deg, #fffbf5 0%, #fef3e2 100%)",
        "cold-mesh":
          "radial-gradient(ellipse at 15% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 45%), radial-gradient(ellipse at 85% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(14, 165, 233, 0.1) 0%, transparent 50%), linear-gradient(180deg, #0a0f1a 0%, #0f172a 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
        "glass-dark":
          "0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        glow: "0 0 40px rgba(139, 92, 246, 0.2)",
        "glow-cold": "0 0 40px rgba(56, 189, 248, 0.15)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
