import { colors } from "./src/brand/colors";
import { fonts } from "./src/brand/fonts";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      fontFamily: fonts,
    },
  },
  plugins: [],
};
