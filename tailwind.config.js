/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a3a20",
        secondary: "#6F61FF",
        accent: "#61FF6F",
        neutral: "#F3F4F6",
        info: "#3ABFF8",
        success: "#36D399",
        warning: "#FBBD23",
        error: "#F87272",
      },
      fontFamily: {
        prosto: ["Prosto One", "sans-serif"],
        syne: ["Syne Mono", "monospace"],
        courier: ["Courier Prime", "monospace"],
        limelight: ["Limelight", "serif"],
        indie: ["Indie Flower", "cursive"],
        amatic: ["Amatic SC", "cursive"],
        gloria: ["Gloria Hallelujah", "cursive"],
      },
      flex: {
        "col-3": "0 0 33.3333%", // Each column takes 1/3 of the width
      },
    },
  },
  plugins: [],
};
