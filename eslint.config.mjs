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

export default [
    {
        ignores: [
            "static/js/publisher-pages/pages/Releases",
            "static/js/publisher-pages/pages/Metrics/metrics",
            "static/js/public/snap-details/publicise.ts",
            "static/js/modules",
            "static/js/dist",
            "node_modules/*",
        ],
    },
    ...compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:prettier/recommended",
        "plugin:jsx-a11y/recommended"
    ),
    {
        plugins: {
            jest,
            react,
            prettier,
            "jsx-a11y": jsxA11Y,
        },
        languageOptions: {
            globals: Object.fromEntries(
                Object.entries({
                    ...globals.browser,
                    ...globals.node,
                    ...jest.environments.globals.globals,
                }).map(([key, value]) => [key.trim(), value])
            ),
            parser: babelParser,
            ecmaVersion: 2020,
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
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },
        languageOptions: {
            parser: tsParser,
             ecmaVersion: 2020, 
        },
        rules: {
            ...compat.extends("plugin:@typescript-eslint/recommended").reduce(
                (rules, config) => ({ ...rules, ...config.rules }),
                {}
            ),
            "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                     "argsIgnorePattern": "^_", // Ignore variables starting with an underscore
                    "caughtErrorsIgnorePattern": "^_" // Ignore `catch` block errors starting with an underscore
                }
            ]
        },
    },
];