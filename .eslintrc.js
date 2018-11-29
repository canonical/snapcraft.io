module.exports = {
  parser: "babel-eslint",
  plugins: ["jest", "react"],
  globals: {},
  env: {
    browser: true,
    es6: true,
    "jest/globals": true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    semi: ["error", "always"],
    "object-curly-spacing": ["error", "always"]
  }
};
