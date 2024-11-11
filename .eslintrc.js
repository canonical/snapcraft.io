module.exports = {
  parser: "@babel/eslint-parser",
  plugins: ["jest", "react", "prettier"],
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
    "jsx-a11y/*": "off", 
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
    "/static/js/publisher" // skip linting any files in the publisher directory 
  ],
};
