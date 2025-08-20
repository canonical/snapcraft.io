module.exports = [
  {
    test: /\.js$/,
    // Exclude node_modules from using babel-loader
    // except some that use ES6 modules and need to be transpiled:
    // such as swiper http://idangero.us/swiper/get-started/
    // and also react-dnd related
    exclude:
      /node_modules\/(?!(dom7|ssr-window|swiper|dnd-core|react-dnd|react-dnd-html5-backend)\/).*/,
    use: {
      loader: "babel-loader",
    },
  },
  {
    test: /\.s[ac]ss$/i,
    use: [
      "style-loader",
      "css-loader",
      {
        loader: "sass-loader",
        options: {
          sassOptions: {
            quietDeps: true,
            silenceDeprecations: ["import", "global-builtin"],
          },
        },
      },
    ],
  },
  // loaders are evaluated from bottom to top (right to left)
  // so first transpile via babel, then expose as global
  {
    test: require.resolve(__dirname + "/static/js/base/base.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/featured-snaps.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/modal.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/homepage.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/blog.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/store-details.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/fsf.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/distro-install.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/publisher-details.ts"),
    use: ["babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/about/index.ts"),
    use: ["babel-loader"],
  },
  {
    test: /\.tsx?/,
    use: ["ts-loader"],
  },
];
