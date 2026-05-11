import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f17",
        panel: "#111827",
        accent: "#3b82f6",
        accentSoft: "#1d4ed8",
      },
      boxShadow: {
        glow: "0 0 30px rgba(59,130,246,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
