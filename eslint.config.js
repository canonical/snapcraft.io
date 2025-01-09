import jest from "eslint-plugin-jest";
import react from "eslint-plugin-react";
import prettier from "eslint-plugin-prettier";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "static/js/publisher-pages/pages/Releases",
        "static/js/publisher-pages/pages/Metrics/metrics",
        "static/js/public/snap-details/publicise.ts",
        "static/js/modules",
        "static/js/dist",
    ],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
    "plugin:jsx-a11y/recommended",
), {
    plugins: {
        jest,
        react,
        prettier,
        "jsx-a11y": jsxA11Y,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...jest.environments.globals.globals,
        },

        parser: babelParser,
        ecmaVersion: 5,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },

            requireConfigFile: false,
        },
    },

    settings: {
        react: {
            version: "detect",
        },
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
}, ...compat.extends("plugin:@typescript-eslint/recommended").map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
})), {
    files: ["**/*.ts", "**/*.tsx"],

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
    },
}];