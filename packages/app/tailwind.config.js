const primary = [
  `hsl(210, 36%, 96%)`,
  `hsl(212, 33%, 89%)`,
  `hsl(210, 31%, 80%)`,
  `hsl(211, 27%, 70%)`,
  `hsl(210, 22%, 49%)`,
  `hsl(209, 28%, 39%)`,
  `hsl(209, 34%, 30%)`,
  `hsl(211, 39%, 23%)`,
];

const secondary = [
  `hsl(186, 100%, 94%)`,
  `hsl(185, 94%, 87%)`,
  `hsl(184, 80%, 74%)`,
  `hsl(185, 57%, 50%)`,
  `hsl(184, 65%, 59%)`,
  `hsl(185, 62%, 45%)`,
  `hsl(184, 77%, 34%)`,
  `hsl(185, 81%, 29%)`,
  `hsl(185, 84%, 25%)`,
  `hsl(184, 91%, 17%)`,
];

const theme = { primary, secondary };
const colors = {};
Object.keys(theme).forEach((name) => {
  colors[name] = {
    // default: `#${color}`,
  };

  theme[name].forEach((value, i) => {
    colors[name][`${i + 1}00`] = value;
  });
});

module.exports = {
  theme: {
    extend: {
      colors,
    },
  },
  variants: {
    height: ["responsive", "hover", "focus"],
    width: ["responsive", "hover", "focus"],
    display: ["responsive", "group-hover", "group-focus"],
    opacity: ["responsive", "hover", "focus", "group-hover", "group-focus"],
  },
  plugins: [require("@tailwindcss/custom-forms")],
};
