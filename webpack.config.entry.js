module.exports = {
  "cookie-policy": "./static/js/base/cookie-policy.ts",
  "global-nav": "./static/js/base/global-nav.ts",
  base: "./static/js/base/base.ts",
  release: "./static/js/publisher/release.tsx",
  about: "./static/js/public/about/index.ts",
  "featured-snaps": "./static/js/public/featured-snaps.ts",
  modal: "./static/js/public/modal.ts",
  // TODO:
  // publisher bundle is big (webpack warning) - try to chunk it down
  // https://github.com/canonical-web-and-design/snapcraft.io/issues/1246
  publisher: "./static/js/publisher/publisher.ts",
  homepage: "./static/js/public/homepage.ts",
  blog: "./static/js/public/blog.ts",
  "store-details": "./static/js/public/store-details.ts",
  fsf: "./static/js/public/fsf.ts",
  "distro-install": "./static/js/public/distro-install.ts",
  "publisher-details": "./static/js/public/publisher-details.ts",
  "brand-store": "./static/js/brand-store/brand-store.tsx",
  "publisher-listing": "./static/js/publisher/listing/index.tsx",
  "publisher-settings": "./static/js/publisher/settings/index.tsx",
  "about-listing": "./static/js/public/about/listing.ts",
  store: "./static/js/store/index.tsx",
  "publisher-pages": "./static/js/publisher-pages/index.tsx",
};
