module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: [
        "http://127.0.0.1:8004/",
        "http://127.0.0.1:8004/store",
        "http://127.0.0.1:8004/search",
        "http://127.0.0.1:8004/lxd",
      ],
      settings: {
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      includePassedAssertions: true,
      assertions: {
        "categories:performance": ["warn", {minScore: 0.6}],
        "categories:accessibility": ["error", {minScore: 0.9}],
        "categories:best-practices": ["error", {minScore: 0.9}],
        "categories:seo": ["error", {minScore: 0.9}],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
