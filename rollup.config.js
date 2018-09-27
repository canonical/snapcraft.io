import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import { uglify } from 'rollup-plugin-uglify';

/* global process */
const production = process.env.ENVIRONMENT !== 'devel';

export default [
  {
    input: 'static/js/base/base.js',
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      production && uglify()
    ],
    output: {
      file: 'static/js/dist/base.js',
      format: 'iife',
      name: 'snapcraft.base',
      sourcemap: true
    }
  },
  {
    input: 'static/js/publisher/publisher.js',
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      commonjs({
        exclude: 'node_modules/process-es6/**',
        include: [
          'node_modules/polylabel/**',
          'node_modules/tinyqueue/**',
          'node_modules/create-react-class/**',
          'node_modules/fbjs/**',
          'node_modules/object-assign/**',
          'node_modules/react/**',
          'node_modules/react-dom/**',
          'node_modules/prop-types/**',
          'node_modules/vanilla-framework-react/**'
        ],
        namedExports: {
          'node_modules/react/index.js': [
            'Children',
            'Component',
            'Fragment',
            'PropTypes',
            'createElement'
          ],
          'node_modules/react-dom/index.js': ['render']
        }
      }),
      // needed for React
      // https://github.com/rollup/rollup/issues/487
      replace({
        'process.env.NODE_ENV': JSON.stringify( 'production' )
      }),
      production && uglify()
    ],
    output: {
      file: 'static/js/dist/publisher.js',
      format: 'iife',
      name: 'snapcraft.publisher',
      sourcemap: true
    }
  },
  {
    input: 'static/js/public/public.js',
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      production && uglify()
    ],
    output: {
      file: 'static/js/dist/public.js',
      format: 'iife',
      name: 'snapcraft.public',
      sourcemap: true
    },
    context: 'window' // This is set for whatwg-fetch to work
  },
  {
    input: 'static/js/publisher/release.js',
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers']
      }),
      // https://github.com/rollup/rollup-plugin-commonjs/issues/200
      commonjs({
        exclude: 'node_modules/process-es6/**',
        include: [
          'node_modules/create-react-class/**',
          'node_modules/fbjs/**',
          'node_modules/object-assign/**',
          'node_modules/react/**',
          'node_modules/react-dom/**',
          'node_modules/prop-types/**',
          'node_modules/vanilla-framework-react/**'
        ],
        namedExports: {
          'node_modules/react/index.js': [
            'Children',
            'Component',
            'Fragment',
            'PropTypes',
            'createElement'
          ],
          'node_modules/react-dom/index.js': ['render']
        }
      }),
      // needed for React
      // https://github.com/rollup/rollup/issues/487
      replace({
        'process.env.NODE_ENV': JSON.stringify( 'production' )
      }),
      production && uglify()
    ],
    output: {
      file: 'static/js/dist/release.js',
      format: 'iife',
      name: 'snapcraft.release',
      sourcemap: true
    }
  },
];
