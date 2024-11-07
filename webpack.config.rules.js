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
    use: ["style-loader", "css-loader", "sass-loader"],
  },
  // TODO:
  // we should get rid of using globals making expose-loader unnecessary
  // https://github.com/canonical-web-and-design/snapcraft.io/issues/1245

  // loaders are evaluated from bottom to top (right to left)
  // so first transpile via babel, then expose as global
  {
    test: require.resolve(__dirname + "/static/js/base/base.ts"),
    use: ["expose-loader?exposes=snapcraft.base", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/publisher/publisher.ts"),
    use: ["expose-loader?exposes=snapcraft.publisher", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/about/index.ts"),
    use: ["expose-loader?exposes=snapcraft.about", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/featured-snaps.ts"),
    use: [
      "expose-loader?exposes=snapcraft.public.featuredSnaps",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/modal.ts"),
    use: ["expose-loader?exposes=snapcraft.public.modal", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/homepage.ts"),
    use: ["expose-loader?exposes=snapcraft.public.homepage", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/blog.ts"),
    use: ["expose-loader?exposes=snapcraft.public.blog", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/store-details.ts"),
    use: [
      "expose-loader?exposes=snapcraft.public.storeDetails",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/fsf.ts"),
    use: ["expose-loader?exposes=snapcraft.public.fsf", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/distro-install.ts"),
    use: [
      "expose-loader?exposes=snapcraft.public.distroInstall",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/publisher-details.ts"),
    use: [
      "expose-loader?exposes=snapcraft.public.publisherDetails",
      "babel-loader",
    ],
  },
  {
    test: /\.tsx?/,
    use: ["ts-loader"],
  },
];
