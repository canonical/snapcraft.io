import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

export default [
  {
    input: 'static/js/base/base.js',
    plugins: [
      nodeResolve({
        jsnext: true
      }),
      babel({
        exclude: 'node_modules/**'
      })
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
        exclude: 'node_modules/**'
      })
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
        exclude: 'node_modules/**'
      })
    ],
    output: {
      file: 'static/js/dist/public.js',
      format: 'iife',
      name: 'snapcraft.public',
      sourcemap: true
    }
  }];
