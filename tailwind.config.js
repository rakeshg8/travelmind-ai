/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A",
        accent: "#14B8A6",
        warning: "#F59E0B",
        danger: "#EF4444",
        success: "#10B981",
        surface: "#1E293B",
        text: "#F1F5F9",
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.25)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239, 68, 68, 0)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.25)", opacity: "1" },
        },
        floatGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2.5s ease-in-out infinite",
        breathe: "breathe 1.6s ease-in-out infinite",
        "float-gradient": "floatGradient 14s ease infinite",
        "slide-up": "slideUp 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};
