import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce7fd",
          500: "#4f6ef7",
          600: "#3b55e6",
          700: "#2f43c4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
