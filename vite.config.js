import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import vitePluginDetectInput from "./vitePluginDetectInput";

const env = loadEnv("all", process.cwd());

// @canonical/react-components and @canonical/store-components ship their own
// Vanilla-derived .scss as JS side effects, so it never passes through our
// styles.scss `@layer vanilla` wrap and builds unlayered - which then beats
// every layered style regardless of specificity. Re-layer it here instead.
const vendorComponentStylesPattern =
  /node_modules\/@canonical\/(react|store)-components\//;

const wrapVendorStylesInVanillaLayer = () => ({
  postcssPlugin: "wrap-vendor-styles-in-vanilla-layer",
  Once(root) {
    const file = root.source?.input?.file || "";
    if (!vendorComponentStylesPattern.test(file)) {
      return;
    }
    const nodes = root.nodes.slice();
    root.removeAll();
    const layer = postcss.atRule({ name: "layer", params: "vanilla" });
    layer.append(nodes);
    root.append(layer);
  },
});
wrapVendorStylesInVanillaLayer.postcss = true;

export default defineConfig({
  plugins: [
    vitePluginDetectInput({
      regex: /vite_import\(["'](.+)["']\)/g,
      glob: "./templates/**/*.html",
    }),
    react(),
  ],
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
      plugins: [wrapVendorStylesInVanillaLayer(), autoprefixer()],
      map: false,
    },
  },
  define: {
    global: "globalThis", // in dev mode "randomstring" uses `global` rather than `globalThis`
  },
  resolve: {
    // Keep /static/fonts as a symlink URL in dev instead of leaking its node_modules realpath
    preserveSymlinks: true,
    dedupe: ["react", "react-dom"],
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
