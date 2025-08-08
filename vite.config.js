import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import entryPoints from "./webpack.config.entry.js";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  esbuild: {
    include: /\.[jt]sx?$/,
    exclude: [],
    loader: "tsx",
  },
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
    // outDir: "static/js/dist",
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
