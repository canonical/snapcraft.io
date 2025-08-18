import react from "@vitejs/plugin-react-swc";
import { defineConfig, transformWithEsbuild } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import entryPoints from "./webpack.config.entry";

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

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(), jsxInJsPlugin()],
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
