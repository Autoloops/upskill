import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" }
    },
    extend: {
      colors: {
        // Inspired by Vercel + Supabase: jet-black canvas, emerald accent, warm zinc text.
        ink: { DEFAULT: "#0a0a0a", soft: "#0d1117", panel: "#11161d", line: "#21262d", divider: "#30363d" },
        fog: { 100: "#f0f6fc", 200: "#c9d1d9", 300: "#8b949e", 400: "#6e7681", 500: "#484f58" },
        accent: { DEFAULT: "#7ee787", muted: "rgba(126,231,135,0.18)", border: "rgba(126,231,135,0.4)" },
        warn: { DEFAULT: "#ffa657", muted: "rgba(255,166,87,0.15)" },
        bad:  { DEFAULT: "#ffa198", muted: "rgba(248,81,73,0.15)" },
        info: { DEFAULT: "#58a6ff", muted: "rgba(88,166,255,0.15)" },
        purple: { DEFAULT: "#d2a8ff", muted: "rgba(187,128,255,0.18)" }
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      fontSize: {
        // tighter type ramp than Tailwind defaults
        "2xs": ["0.6875rem", { lineHeight: "1rem" }]
      },
      letterSpacing: { ultra: "-0.04em", micro: "0.04em" },
      boxShadow: {
        glow: "0 0 0 1px rgba(126,231,135,0.18), 0 8px 32px -8px rgba(126,231,135,0.18)"
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        radial: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(126,231,135,0.12), transparent 60%)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
} satisfies Config;
