import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f1fb",
          100: "#e7e0f6",
          200: "#cdbcec",
          300: "#b094df",
          400: "#8f67cf",
          500: "#7344bd",
          600: "#5d33a0",
          700: "#4a2980",
          800: "#3a2065",
          900: "#2c184d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
