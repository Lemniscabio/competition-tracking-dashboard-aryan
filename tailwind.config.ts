import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          card: "#0f0f17",
          elevated: "#141420",
        },
        border: {
          DEFAULT: "#1a1a2e",
          light: "#252540",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          muted: "#1e3a5f",
        },
        text: {
          DEFAULT: "#e2e8f0",
          muted: "#94a3b8",
          dim: "#64748b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
