module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost.test",
  },
  collectCoverage: true,
  coverageReporters: ["html", "cobertura"],
  coverageDirectory: "coverage/js",
  transformIgnorePatterns: [
    "node_modules/@canonical/(?!(react-components|store-components))",
  ],
  moduleNameMapper: {
    "\\.(scss|sass|css)$": "identity-obj-proxy",
  },
};
