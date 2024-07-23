module.exports = {
  parser: "@babel/eslint-parser",
  plugins: ["jsx-a11y"],
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "plugin:jsx-a11y/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false,
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["jsx-a11y"],
      extends: [
        "plugin:jsx-a11y/recommended",
      ],
    },
  ],
};
