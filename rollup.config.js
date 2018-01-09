import nodeResolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'static/js/publisher/publisher.js',
    plugins: [
      nodeResolve({
        jsnext: true
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
      })
    ],
    output: {
      file: 'static/js/dist/public.js',
      format: 'iife',
      name: 'snapcraft.public',
      sourcemap: true
    }
  }];