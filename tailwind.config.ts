import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        sunken: "rgb(var(--sunken) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--fg-muted) / <alpha-value>)",
        faint: "rgb(var(--fg-faint) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          hover: "rgb(var(--danger-hover) / <alpha-value>)",
          soft: "rgb(var(--danger-soft) / <alpha-value>)",
          ink: "rgb(var(--danger-ink) / <alpha-value>)",
        },
        scrim: "rgb(var(--scrim) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        display: ["Onest Variable", "Onest", "Inter Variable", "system-ui", "sans-serif"],
      },
      fontSize: {
        meta: ["13px", { lineHeight: "18px" }],
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.05), 0 1px 3px rgb(15 23 42 / 0.05)",
        raised: "0 24px 50px -20px rgb(15 23 42 / 0.3), 0 4px 12px -4px rgb(15 23 42 / 0.13)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
} satisfies Config;
