import nodeResolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";

/* global process */
const production = process.env.ENVIRONMENT !== "devel";

export default [
  {
    input: "static/js/base/base.js",
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: "node_modules/**",
        plugins: ["external-helpers"]
      }),
      production && uglify()
    ],
    output: {
      file: "static/js/dist/base.js",
      format: "iife",
      name: "snapcraft.base",
      sourcemap: true
    }
  },
  {
    input: "static/js/public/public.js",
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        plugins: ["external-helpers"]
      }),
      commonjs({
        exclude: "node_modules/process-es6/**",
        include: ["node_modules/date-fns/**"]
      }),
      production && uglify()
    ],
    output: {
      file: "static/js/dist/public.js",
      format: "iife",
      name: "snapcraft.public",
      sourcemap: true
    },
    context: "window" // This is set for whatwg-fetch to work
  }
];
