module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost.test",
  },
  collectCoverage: true,
  transformIgnorePatterns: ["node_modules/@canonical/(?!react-components)"],
};
