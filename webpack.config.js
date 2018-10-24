/* eslint-env node */

/* TODO:
- dev vs production env
- uglify
- watch
- hot module reloading
- don't export globals (bundle to read data from template) https://github.com/webpack/webpack/issues/2683#issuecomment-228181205
- once rollup is gone update to babel-loader@8 and @babel/core, etc
*/
module.exports = {
  entry: {
    release: "./static/js/publisher/release.js"
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/static/js/dist"
  },
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      // TODO:
      // we should get rid of using globals making expose-loader unnecessary
      {
        test: require.resolve(__dirname + "/static/js/publisher/release.js"),
        use: [
          // loaders are evaluated from bottom to top
          // so first transpile via babel, then expose as global
          {
            loader: "expose-loader",
            options: "snapcraft.release"
          },
          {
            loader: "babel-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    // TODO: uglify on production
    // new UglifyJsPlugin({
    //   sourceMap: true
    // }),
  ]
};
