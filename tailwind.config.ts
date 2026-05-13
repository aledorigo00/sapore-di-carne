import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#120c0c",
          clay: "#6d1f20",
          ember: "#b51217",
          sand: "#ead7d1",
          cream: "#f9f2ec",
          moss: "#3b1113",
        },
      },
      boxShadow: {
        soft: "0 18px 55px rgba(18, 12, 12, 0.14)",
      },
      backgroundImage: {
        "grain-glow":
          "radial-gradient(circle at top, rgba(181,18,23,0.24), transparent 30%), linear-gradient(180deg, rgba(249,242,236,0.98), rgba(234,215,209,0.92))",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        display: ["Futura", "Futura PT", "Trebuchet MS", "Arial", "sans-serif"],
        body: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        reveal: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        reveal: "reveal 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
