import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm cream colors for light mode instead of pure white
        cream: {
          50: '#fefdfb',
          100: '#fdfbf7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
