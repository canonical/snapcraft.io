import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import babelPlugin from "vite-plugin-babel";
import babelConfig from "./babel.config.json";
import entryPoints from "./webpack.config.entry.js";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    babelPlugin({
      babelConfig,
      exclude:
        /node_modules\/(?!(dom7|ssr-window|swiper|dnd-core|react-dnd|react-dnd-html5-backend)\/).*/,
    }),
    react(),
    cssInjectedByJsPlugin(),
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
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    // outDir: "static/js/dist", // TODO: could we move these somewhere else?
    rollupOptions: {
      input: entryPoints,
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name][extname]`,
      },
    },
  },
});
