import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { globSync } from "tinyglobby";

/**
 * @import {GlobOptions} from "tinyglobby"
 * @import {UserConfig} from "vite"
 *
 * @callback RegexMatchCallback
 * @param {RegExpMatchArray} match
 * @returns {string}
 *
 * @typedef {Object} PluginConfig
 * @property {RegExp} regex a RegExp used to match file contents matching file
 * paths to be injected in the Vite configuration
 * @property {RegexMatchCallback} [matchCallback] callback that transforms a
 * RegExp match into a file path;
 * defaults to returning the value at the last index in the RegExpMatchArray
 * @property {string | string[]} [glob] patterns that match files to be read
 * by the plugin;
 * defaults to matching all files in the current directory and its children
 * @property {Omit<GlobOptions, "patterns">} [globOptions] configuration object
 * for "tinyglobby";
 * defaults to ignoring files in "node_modules" and Python virtual env
 */

/**
 * Reads all files that match `pluginConfig.glob` looking for strings that
 * match `pluginConfig.regex`; all RegExp matches are transformed into
 * strings representing file paths by `pluginConfig.matchCallback`.
 *
 * @param {PluginConfig} pluginConfig
 * @returns {string[]}
 */
const searchMatches = (pluginConfig) => {
  const { regex, matchCallback, glob, globOptions } = pluginConfig;

  const globMatches = globSync(glob, globOptions);

  const regexMatches = globMatches
    .map((f) =>
      Array.from(readFileSync(f).toString().matchAll(regex)).map(matchCallback),
    )
    .flat();

  // remove possible duplicate imports, sort just for clarity
  const result = Array.from(new Set(regexMatches)).sort();

  return result;
};

/**
 * Print the list of paths formatted in a more appealing way
 * @param {string[]} input List of file paths
 */
const prettyPrintInput = (input) => {
  console.log(
    "🔍 Detected entry points:\n" +
      input
        .map((file, i) => (i === input.length - 1 ? " └─ " : " ├─ ") + file)
        .join("\n"),
  );
};

/**
 * Default values for the plugin config; `regex` member is deliberately omitted
 * and must be provided by the user
 * @type {PluginConfig}
 */
const DEFAULT_PLUGIN_CONFIG = {
  matchCallback: (match) => match.at(-1),
  glob: "**/*",
  globOptions: {
    ignore: ["**/node_modules/*", "**/.venv/*", "**/venv/*"],
  },
};

/**
 * Plugin that automatically detects and injects entry points into the Vite
 * config.
 *
 * @param {PluginConfig} pluginConfig
 * @returns {UserConfig}
 */
const vitePluginDetectInput = (pluginConfig) => ({
  name: "vite-plugin-detect-input",
  config(config, env) {
    let input = [];

    // In dev mode we don't need to define entry points
    if (env.mode === "development") return config;

    // extend `pluginConfig` with the default values
    pluginConfig = {
      ...DEFAULT_PLUGIN_CONFIG,
      ...pluginConfig,
    };

    if (!pluginConfig.regex) {
      throw new Error("⚠️ Must provide a `regex` value in the plugin config");
    }

    input = searchMatches(pluginConfig);

    if (input.length === 0) {
      throw new Error("⚠️ Can't find any entry points for production build");
    }

    prettyPrintInput(input);

    return defineConfig({
      build: {
        rollupOptions: {
          input, // this will be deep-merged into the current config
        },
      },
    });
  },
});

export default vitePluginDetectInput;
