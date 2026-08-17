module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
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
        "categories:performance": [
          "warn",
          {aggregationMethod: "median", minScore: 0.6},
        ],
        "categories:accessibility": [
          "error",
          {aggregationMethod: "median", minScore: 0.9},
        ],
        "categories:best-practices": [
          "error",
          {aggregationMethod: "median", minScore: 0.9},
        ],
        "categories:seo": [
          "error",
          {aggregationMethod: "median", minScore: 0.9},
        ],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
