module.exports = {
  "cookie-policy": "./static/js/base/cookie-policy.js",
  "global-nav": "./static/js/base/global-nav.js",
  base: "./static/js/base/base.js",
  release: "./static/js/publisher/release.js",
  about: "./static/js/public/about/index.js",
  "featured-snaps": "./static/js/public/featured-snaps.ts",
  modal: "./static/js/public/modal.js",
  // TODO:
  // publisher bundle is big (webpack warning) - try to chunk it down
  // https://github.com/canonical-web-and-design/snapcraft.io/issues/1246
  publisher: "./static/js/publisher/publisher.js",
  homepage: "./static/js/public/homepage.js",
  blog: "./static/js/public/blog.js",
  store: "./static/js/public/store.js",
  "store-details": "./static/js/public/store-details.js",
  fsf: "./static/js/public/fsf.js",
  search: "./static/js/public/search.js",
  "distro-install": "./static/js/public/distro-install.js",
  "publisher-details": "./static/js/public/publisher-details.js",
  "brand-store": "./static/js/brand-store/brand-store.tsx",
  "publisher-listing": "./static/js/publisher/listing/index.tsx",
  "publisher-settings": "./static/js/publisher/settings/index.tsx",
  "publisher-collaboration": "./static/js/publisher/collaboration/index.tsx",
  "about-listing": "./static/js/public/about/listing.ts",
  "beta-store": "./static/js/store/index.tsx",
};
