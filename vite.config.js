import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, transformWithEsbuild } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { execSync } from "node:child_process";

/**
 * Plugin that automatically detects and injects entry points based on the
 */
const flaskViteImportPlugin = () => ({
  name: "flask-build-input-config",
  config(config, env) {
    // In dev mode we don't need to define entry points
    if (env.mode === "development") return config;

    let input = [];

    try {
      // In production mode the entry points are the arguments of all the
      // `vite_import(...)` calls in templates/
      const viteImports =
        execSync(
          // TODO: do it in Node to make it truly portable`
          `grep -rnoh --include '*.html' -e 'vite_import\\((.*)\\)'`
        ).toString() || ""; // big multi-line string wit the format
      // `vite_import(<filename>)`

      // filenames are contained in strings with either " or ' as delimiters
      const imports = viteImports
        .replaceAll(`"`, `'`) // replace all " with '
        .split(`'`) // split on '
        .filter((_, i) => i % 2 === 1); // the filenames sit at odd indices

      // remove possible duplicate imports, sort just for clarity
      input = Array.from(new Set(imports)).sort();

      console.info("Building bundles for the following entry points:", input);
    } catch (e) {
      throw new Error(
        "Vite: Couldn't find any entry points for production build\n" +
          e.toString()
      );
    }

    // this will be deep-merged with the current config
    return defineConfig({
      build: {
        rollupOptions: {
          input,
        },
      },
    });
  },
});

/**
 * Vite is opinionated and doesn't support JSX in .js files (and that's cool).
 * This plugin makes it clear that we don't care about its opinions: process
 * all .js files with esbuild as if they were .jsx.
 *
 * This has a small performance penalty compared to renaming the files, but
 * for the moment it's fine and we can easily get rid of it later
 */
const jsxInJsPlugin = () => ({
  name: "jsx-in-js",
  async transform(code, id) {
    if (!id.match(/\.js$/)) return null;

    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
});

const env = loadEnv("all", process.cwd());

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(), jsxInJsPlugin()],
  server: {
    port: env?.VITE_PORT || 5173,
    cors: {
      origin: "http://localhost:8004", // needed for backend integration with Flask
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin"],
      },
    },
  },
  build: {
    manifest: true,
    modulePreload: false,
    emptyOutDir: true,
    sourcemap: "hidden",
    outDir: env?.VITE_OUTPUT_DIR || "static/js/dist/vite",
    rollupOptions: {
      input: entryPoints,
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `chunks/[name].js`,
        assetFileNames: `assets/[name][extname]`,
      },
    },
  },
});
