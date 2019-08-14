/* eslint-env node */

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

const production = process.env.ENVIRONMENT !== "devel";

// turn on uglify plugin on production
const plugins = production
  ? [
      new UglifyJsPlugin({
        sourceMap: true
      })
    ]
  : [];

module.exports = {
  entry: {
    "global-nav": "./static/js/base/global-nav.js",
    base: "./static/js/base/base.js",
    release: "./static/js/publisher/release.js",
    public: "./static/js/public/public.js",
    // TODO:
    // publisher bundle is big (webpack warning) - try to chunk it down
    // https://github.com/canonical-web-and-design/snapcraft.io/issues/1246
    publisher: "./static/js/publisher/publisher.js"
  },
  output: {
    filename: "[name].js",
    path: __dirname + "/static/js/dist"
  },
  mode: production ? "production" : "development",
  devtool: production ? "source-map" : "eval-source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        // Exclude node_modules from using babel-loader
        // except some that use ES6 modules and need to be transpiled:
        // such as swiper http://idangero.us/swiper/get-started/
        // and also react-dnd related
        exclude: /node_modules\/(?!(dom7|ssr-window|swiper|dnd-core|react-dnd|react-dnd-html5-backend)\/).*/,
        use: {
          loader: "babel-loader"
        }
      },
      // TODO:
      // we should get rid of using globals making expose-loader unnecessary
      // https://github.com/canonical-web-and-design/snapcraft.io/issues/1245

      // loaders are evaluated from bottom to top (right to left)
      // so first transpile via babel, then expose as global
      {
        test: require.resolve(__dirname + "/static/js/base/base.js"),
        use: ["expose-loader?snapcraft.base", "babel-loader"]
      },
      {
        test: require.resolve(__dirname + "/static/js/publisher/release.js"),
        use: ["expose-loader?snapcraft.release", "babel-loader"]
      },
      {
        test: require.resolve(__dirname + "/static/js/publisher/publisher.js"),
        use: ["expose-loader?snapcraft.publisher", "babel-loader"]
      },
      {
        test: require.resolve(__dirname + "/static/js/public/public.js"),
        use: ["expose-loader?snapcraft.public", "babel-loader"]
      }
    ]
  },
  plugins: plugins
};
