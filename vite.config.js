import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import autoprefixer from "autoprefixer";
import { execSync } from "node:child_process";
import { rgPath as rg } from "@vscode/ripgrep";

/**
 * Plugin that automatically detects and injects entry points based on the
 * vite_import(...) calls
 */
const viteFlaskImportPlugin = () => ({
  name: "vite-flask-import-plugin",
  config(config, env) {
    // In dev mode we don't need to define entry points
    if (env.mode === "development") return config;

    let input = [];

    // In production mode the entry points can be read by parsing the strings
    // passed as arguments to the `vite_import(...)` calls in templates/; we
    // use ripgrep to search for all `vite_import(<filename>)` calls, the
    // result is a big multi-line string with all the file names
    const viteImports =
      execSync(
        `${rg} -oNI -t 'html' -e 'vite_import\\((.+)\\)' -r "\\$1" ./templates`,
      ).toString() || "";

    // filenames are contained in strings with either " or ' as delimiters
    const imports = viteImports
      .replaceAll(/["']/g, "") // remove all " and '
      .split("\n")
      .filter(Boolean); // remove empty strings

    // remove possible duplicate imports, sort just for clarity
    input = Array.from(new Set(imports)).sort();

    if (input.length === 0) {
      throw new Error("⚠️ Can't find any entry points for production build");
    }

    console.log("🔍 Detected entry points:");
    for (const file of input) console.log("  " + file);

    return defineConfig({
      build: {
        rollupOptions: {
          input, // this will be deep-merged into the current config
        },
      },
    });
  },
});

const env = loadEnv("all", process.cwd());

export default defineConfig({
  plugins: [viteFlaskImportPlugin(), react()],
  server: {
    port: env?.VITE_PORT || 5173,
    host: true,
    cors: {
      origin: [
        "http://localhost:8004",
        "http://127.0.0.1:8004",
        "http://0.0.0.0:8004",
      ], // needed for backend integration with Flask
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ["import", "global-builtin"],
      },
    },
    postcss: {
      plugins: [autoprefixer()],
      map: false,
    },
  },
  define: {
    global: "globalThis", // in dev mode "randomstring" uses `global` rather than `globalThis`
  },
  resolve: {
    alias: [
      // by default react-components exports a CJS module that can't be tree-shaken, we consume the ESM instead
      {
        find: /^@canonical\/react-components$/,
        replacement: "@canonical/react-components/dist/esm",
      },
    ],
  },
  base: "./", // use the script's URL path as base when loading assets in dynamic imports
  build: {
    manifest: true,
    modulePreload: false,
    emptyOutDir: true,
    sourcemap: "hidden",
    outDir: env?.VITE_OUTDIR || "static/js/dist/vite",
    rollupOptions: {
      output: {
        entryFileNames: `[name]--[hash].js`,
        chunkFileNames: `chunks/[name]--[hash].js`,
        assetFileNames: `assets/[name]--[hash][extname]`,
      },
    },
  },
});
