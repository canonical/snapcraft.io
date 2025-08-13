import react from "@vitejs/plugin-react-swc";
import { execSync } from "node:child_process";
import { defineConfig, transformWithEsbuild } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import entryPoints from "./webpack.config.entry"

const flaskBuildInputConfig = () => ({
  name: "flask-build-input-config",
  config(config, env) {
    // In dev mode we don't need to define entry points
    if (env.mode === "development") return config;

    let input = [];

    try {
      // So we get a list of all "vite_import(...)" calls in "./templates/"
      const viteImports =
        execSync(
          // TODO: we should do it without grep to make it portable
          `grep -rn templates/ -e 'vite_import\\((.*)\\)'`
        ).toString() || "";

      const imports = new Set();

      // grep returns the origin file name and line on top of the match for
      // "vite_import(...)", so we must extract the JS/TS entry point path
      for (const match of viteImports.matchAll(/\(["'](?<file>.+)["']\)/g)) {
        imports.add(match.groups.file);
      }

      input = Array.from(imports).sort();

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

export default defineConfig({
  plugins: [
    // flaskBuildInputConfig(),
    react(),
    cssInjectedByJsPlugin(),
    jsxInJsPlugin(),
  ],
  server: {
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
    outDir: "static/js/dist/vite",
    rollupOptions: {
      input: entryPoints, // TODO: remove as flaskEntrypointConfig will populate this
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `chunks/[name].js`,
        assetFileNames: `assets/[name][extname]`,
      },
    },
  },
});
