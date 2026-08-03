import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        fog: "rgb(var(--color-fog) / <alpha-value>)",
        coral: "rgb(var(--color-coral) / <alpha-value>)",
        lime: "rgb(var(--color-lime) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        "signal-sm": "var(--shadow-signal-sm)",
        signal: "var(--shadow-signal)",
      },
    },
  },
  plugins: [],
};

export default config;
