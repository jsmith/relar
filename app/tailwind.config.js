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
  purge: {
    // I have to do this since tailwind only purges in "production" by default
    enabled: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging",
    content: ["./src/**/*.html", "./src/**/*.tsx", "./src/**/*.ts"],
  },
};
