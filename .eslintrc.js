module.exports = {
  plugins: ["jest"],
  env: {
    browser: true,
    es2021: true,
    "jest/globals": true,
  },
  extends: "eslint:recommended",
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
  },
};
