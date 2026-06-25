import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class", // kept for future toggle
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#f8f9fa",
          card: "#ffffff",
          elevated: "#f1f3f5",
        },
        border: {
          DEFAULT: "#e2e5e9",
          light: "#cdd1d6",
        },
        accent: {
          DEFAULT: "#0d9488",
          hover: "#0f766e",
          muted: "#ccfbf1",
        },
        text: {
          DEFAULT: "#1a1a2e",
          muted: "#5c6370",
          dim: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};
export default config;
