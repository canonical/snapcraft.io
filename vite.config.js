import react from "@vitejs/plugin-react-swc";
import { execSync } from "node:child_process";
import { defineConfig, transformWithEsbuild } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { execSync } from "node:child_process";

let entryPoints = []; // In dev mode we don't need to define entry points...
if (process.env.NODE_ENV != "development") {
  // ... but when building static bundles we need to!

  try {
    // So we get a list of all "vite_import(...)" calls in "./templates/"
    const viteImports =
      execSync(
        // TODO: we should do it without grep to make it portable
        `grep -rn templates/ -e 'vite_import\\((.*)\\)'`
      ).toString() || "";

    // grep returns the origin file name and line on top of the match for
    // "vite_import(...)", so we must extract the JS/TS entry point path
    entryPoints = Array.from(
      viteImports.matchAll(/\(["'](?<file>.+)["']\)/g)
    ).map((m) => m.groups.file);

    console.info(
      "Building bundles for the following entry points:",
      entryPoints
    );
  } catch (e) {
    console.error(e.toString());

    throw new Error(
      "Vite: Couldn't find any entry points for production build"
    );
  }
  }
// TODO: could this ^^^ be turned into a Vite plugin? The "config" hook allows
// us to mutate the config before resolving it and starting the build process

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
      input: entryPoints,
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `chunks/[name].js`,
        assetFileNames: `assets/[name][extname]`,
      },
    },
  },
});
