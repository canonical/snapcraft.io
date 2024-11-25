module.exports = {
  parser: "@babel/eslint-parser",
  plugins: ["jest", "react", "prettier", "jsx-a11y"],
  globals: {},
  env: {
    browser: true,
    es6: true,
    node: true,
    "jest/globals": true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false,
  },
  rules: {
    "linebreak-style": ["error", "unix"],
    semi: ["error", "always"],
    "object-curly-spacing": ["error", "always"],
    "prettier/prettier": "error",
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: ["plugin:@typescript-eslint/recommended"],
    },
  ],
  ignorePatterns: [
    "/static/js/publisher", // skip linting any files in the publisher directory
    "/static/js/publisher-pages/pages/Releases", // skip releases for now as structural changes are required to fix TS errors
  ],
};
