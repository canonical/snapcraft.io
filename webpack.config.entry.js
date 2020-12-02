module.exports = {
  "cookie-policy": "./static/js/base/cookie-policy.js",
  "global-nav": "./static/js/base/global-nav.js",
  base: "./static/js/base/base.js",
  release: "./static/js/publisher/release.js",
  public: "./static/js/public/public.js",
  about: "./static/js/public/about/index.js",
  tabpanel: "./static/js/public/hero-tabpanel.js",
  modal: "./static/js/public/modal.js",
  "manage-members": "./static/js/public/manage-members.js",
  // TODO:
  // publisher bundle is big (webpack warning) - try to chunk it down
  // https://github.com/canonical-web-and-design/snapcraft.io/issues/1246
  publisher: "./static/js/publisher/publisher.js",
};
