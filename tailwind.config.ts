import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        bg: {
          DEFAULT: "#0a0a0a",
          secondary: "#111111",
          card: "#141414",
          hover: "#1a1a1a",
        },
        // Neon purple — primary
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          DEFAULT: "#a855f7",
          neon: "#c026d3",
        },
        // Cyan — accent 1
        cyan: {
          DEFAULT: "#06b6d4",
          neon: "#00d4ff",
          soft: "#22d3ee",
          dark: "#0891b2",
        },
        // Hot pink — accent 2
        pink: {
          DEFAULT: "#ec4899",
          neon: "#ff0080",
          soft: "#f472b6",
          dark: "#db2777",
        },
        // Neon green — accent 3
        green: {
          DEFAULT: "#22c55e",
          neon: "#39ff14",
          soft: "#4ade80",
          dark: "#16a34a",
        },
        // Text
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#475569",
          dim: "#1e293b",
        },
        // Borders
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          bright: "rgba(255,255,255,0.15)",
          purple: "rgba(168,85,247,0.4)",
          cyan: "rgba(6,182,212,0.4)",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "purple-glow": "radial-gradient(ellipse at center, rgba(168,85,247,0.15) 0%, transparent 70%)",
        "cyan-glow": "radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)",
        "hero-gradient": "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.2) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "neon-border": "linear-gradient(135deg, rgba(168,85,247,0.5), rgba(6,182,212,0.5))",
      },
      boxShadow: {
        "glow-purple": "0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.1)",
        "glow-cyan": "0 0 20px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.1)",
        "glow-pink": "0 0 20px rgba(236,72,153,0.4), 0 0 40px rgba(236,72,153,0.1)",
        "glow-green": "0 0 20px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.1)",
        "card": "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card-hover": "0 8px 40px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
        "button": "0 4px 14px rgba(168,85,247,0.4)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "scan-line": "scan-line 4s linear infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out forwards",
        "spin-slow": "spin 8s linear infinite",
        "gradient": "gradient 8s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "gradient": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
