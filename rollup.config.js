import nodeResolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'snapcraftio/static/js/publisher/publisher.js',
    plugins: [
      nodeResolve({
        jsnext: true
      })
    ],
    output: {
      file: 'snapcraftio/static/js/dist/publisher.js',
      format: 'iife',
      name: 'snapcraft.publisher',
      sourcemap: true
    }
  },
  {
    input: 'snapcraftio/static/js/public/public.js',
    plugins: [
      nodeResolve({
        jsnext: true
      })
    ],
    output: {
      file: 'snapcraftio/static/js/dist/public.js',
      format: 'iife',
      name: 'snapcraft.public',
      sourcemap: true
    }
  }];