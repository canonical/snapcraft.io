import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import autoprefixer from "autoprefixer";
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
          `grep -rnoh --include '*.html' -e 'vite_import\\((.*)\\)'`,
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
          e.toString(),
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

const env = loadEnv("all", process.cwd());

export default defineConfig({
  plugins: [flaskViteImportPlugin(), react()],
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
