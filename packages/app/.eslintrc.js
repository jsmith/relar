module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "eslint-config-restricted-globals",
  ],
  settings: {
    react: {
      // We need to specify this or else we get a warning
      version: "detect",
    },
  },
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "react-hooks"],
  rules: {
    "no-unused-vars": "off",
    // Turn off unused var rule for now. Maybe we can add it later but it's annoying
    // "@typescript-eslint/no-unused-vars-experimental": "error",
    "react/prop-types": ["off"],
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "error", // Checks effect dependencies
    // "no-restricted-imports": ["error", { patterns: ["../*", "./*"] }],
  },
};
