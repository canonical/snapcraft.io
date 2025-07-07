require("esbuild").build({
  entryPoints: ["static/js/base/patterns.mjs"],
  bundle: true,
  outfile: "static/js/dist/vanilla.bundle.mjs",
  format: "esm",
  sourcemap: true,
  minify: false, // for testing/readability
  tsconfigRaw: {}, // override default project tsconfig (we don't need it here)
});
