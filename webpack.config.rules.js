module.exports = [
  {
    test: /\.js$/,
    // Exclude node_modules from using babel-loader
    // except some that use ES6 modules and need to be transpiled:
    // such as swiper http://idangero.us/swiper/get-started/
    // and also react-dnd related
    exclude: /node_modules\/(?!(dom7|ssr-window|swiper|dnd-core|react-dnd|react-dnd-html5-backend)\/).*/,
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
    test: require.resolve(__dirname + "/static/js/base/base.js"),
    use: ["expose-loader?exposes=snapcraft.base", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/publisher/release.js"),
    use: ["expose-loader?exposes=snapcraft.release", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/publisher/publisher.js"),
    use: ["expose-loader?exposes=snapcraft.publisher", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/about/index.js"),
    use: ["expose-loader?exposes=snapcraft.about", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/hero-tabpanel.js"),
    use: ["expose-loader?exposes=snapcraft.public.tabpanel", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/manage-invites.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.manageInvites",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/manage-members.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.manageMembers",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/manage-snaps.js"),
    use: ["expose-loader?exposes=snapcraft.public.manageSnaps", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/modal.js"),
    use: ["expose-loader?exposes=snapcraft.public.modal", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/homepage.js"),
    use: ["expose-loader?exposes=snapcraft.public.homepage", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/blog.js"),
    use: ["expose-loader?exposes=snapcraft.public.blog", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/store.js"),
    use: ["expose-loader?exposes=snapcraft.public.store", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/store-details.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.storeDetails",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/fsf.js"),
    use: ["expose-loader?exposes=snapcraft.public.fsf", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/search.js"),
    use: ["expose-loader?exposes=snapcraft.public.search", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/distro-install.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.distroInstall",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/publisher-details.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.publisherDetails",
      "babel-loader",
    ],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/brand-store.js"),
    use: ["expose-loader?exposes=snapcraft.public.brandStore", "babel-loader"],
  },
  {
    test: require.resolve(__dirname + "/static/js/public/invite-members.js"),
    use: [
      "expose-loader?exposes=snapcraft.public.inviteMembers",
      "babel-loader",
    ],
  },
];
