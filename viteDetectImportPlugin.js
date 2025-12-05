import { defineConfig } from "vite";
import { execSync } from "node:child_process";
import { rgPath as rg } from "@lvce-editor/ripgrep";

// TODO: this could be generalized to support other regex patterns and moved into a separate NPM package

/**
 * Plugin that automatically detects and injects entry points based on the
 * vite_import(...) calls
 */
const viteDetectImportPlugin = () => ({
  name: "vite-flask-import-plugin",
  config(config, env) {
    // In dev mode we don't need to define entry points
    if (env.mode === "development") return config;

    // In production mode the entry points can be read by parsing the strings
    // passed as arguments to the `vite_import(...)` calls in templates/; we
    // use ripgrep to search for all `vite_import(<filename>)` calls, the
    // result is a big multi-line string with all the file names.
    // We use ripgrep because it's very fast and cross-platform.

    let input = [];

    const pattern = /vite_import\(["'](.+)["']\)/
      .toString() // convert the regex into something that ripgrep can use
      .slice(1, -1) // remove regex / delimiters
      .replaceAll(/([^\\])"/g, '$1\\"'); // escape all unescaped double quotes

    const captureString =
      process.platform === "win32"
        ? `$1` // windows doesn't ask us to escape dollar sign with a backslash
        : `\\$1`; // any other platform does though

    const viteImports =
      execSync(
        `${rg} -oNI -t "html" -e "${pattern}" ./templates -r "${captureString}"`,
      ).toString() || "";

    // the string has multiple lines, some of which might be blank, so split
    // on newlines and filter out the empty strings
    const imports = viteImports.split("\n").filter(Boolean);

    // remove possible duplicate imports, sort just for clarity
    input = Array.from(new Set(imports)).sort();

    if (input.length === 0) {
      throw new Error("⚠️ Can't find any entry points for production build");
    }

    console.log(
      "🔍 Detected entry points:\n" +
        input
          .map((file, i) => (i === input.length - 1 ? " └─ " : " ├─ ") + file)
          .join("\n"),
    );

    return defineConfig({
      build: {
        rollupOptions: {
          input, // this will be deep-merged into the current config
        },
      },
    });
  },
});

export default viteDetectImportPlugin;
