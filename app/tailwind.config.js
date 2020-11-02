module.exports = {
  dark: "class",
  experimental: {
    darkModeVariant: true,
  },
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  variants: {
    height: ["responsive", "hover", "focus"],
    width: ["responsive", "hover", "focus", "group-hover"],
    display: ["responsive", "group-hover", "group-focus"],
    opacity: ["responsive", "hover", "focus", "group-hover", "group-focus"],
  },
  plugins: [require("@tailwindcss/custom-forms")],
  purge: ["./src/**/*.html", "./src/**/*.tsx", "./src/**/*.ts"],
};
