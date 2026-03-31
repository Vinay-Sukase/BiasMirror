import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"]
      },
      colors: {
        ink: "#f6f1ff",
        canvas: "#160f29",
        plum: "#6f4ef6",
        iris: "#9a7cff",
        haze: "#cfc4ff",
        surface: "rgba(255,255,255,0.12)"
      },
      boxShadow: {
        glow: "0 20px 60px rgba(111, 78, 246, 0.28)"
      },
      backdropBlur: {
        xs: "4px"
      }
    }
  },
  plugins: []
} satisfies Config;
