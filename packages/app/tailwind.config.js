const primary = [
  `hsl(210, 36%, 96%)`,
  `hsl(212, 33%, 89%)`,
  `hsl(210, 31%, 80%)`,
  `hsl(211, 27%, 70%)`,
  `hsl(210, 22%, 49%)`,
  `hsl(209, 28%, 39%)`,
  `hsl(209, 34%, 30%)`,
  `hsl(211, 39%, 23%)`,
]

const theme = { primary };
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
    }
  },
  variants: {},
  plugins: [
    require('@tailwindcss/custom-forms'),
  ],
}
