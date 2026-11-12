import { colors } from "./src/theme/colors.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Defined in src/theme/colors.js so the SVG map can share them.
      // Fonts are Tailwind's default system stack: San Francisco on the iPad,
      // so the app reads like the rest of the device, with nothing to download.
      colors,
    },
  },
  plugins: [],
};
