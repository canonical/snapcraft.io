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
  rules: {
    "no-unused-vars": "off",
    "no-non-null-assertion": "off",
    "no-undef": "off",
    "react/prop-types": "off",
    "react/jsx-key": "off",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["jsx-a11y"],
      extends: [
        "plugin:jsx-a11y/recommended",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-types": "off",
        "prefer-const": "off",
        "react/no-children-prop": "off",
      },
    },
  ],
};
