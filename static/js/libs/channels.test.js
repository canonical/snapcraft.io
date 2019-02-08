import {
  sortChannels,
  parseChannel,
  createChannelTree,
  sortAlphaNum
} from "./channels";

describe("parseChannel", () => {
  describe("risk", () => {
    it("should return as 'latest' track", () => {
      expect(parseChannel("stable")).toEqual({
        track: "latest",
        risk: "stable",
        branch: "_base",
        format: {
          track: false,
          risk: true,
          branch: false
        }
      });
    });
  });

  describe("track/risk", () => {
    it("should return with track", () => {
      expect(parseChannel("test/stable")).toEqual({
        track: "test",
        risk: "stable",
        branch: "_base",
        format: {
          track: true,
          risk: true,
          branch: false
        }
      });
    });
  });

  describe("risk/branch", () => {
    it("should return with branch and 'latest' track", () => {
      expect(parseChannel("stable/test")).toEqual({
        track: "latest",
        risk: "stable",
        branch: "test",
        format: {
          track: false,
          risk: true,
          branch: true
        }
      });
    });
  });

  describe("options", () => {
    describe("defaultTrack", () => {
      it("should add the default track for risk only string", () => {
        expect(parseChannel("stable", { defaultTrack: "test" })).toEqual({
          track: "test",
          risk: "stable",
          branch: "_base",
          format: {
            track: false,
            risk: true,
            branch: false
          }
        });
      });
    });
  });
});

describe("createChannelTree", () => {
  let channelList;
  describe("risk only", () => {
    beforeEach(() => {
      channelList = ["stable", "beta", "candidate", "edge"].map(channel =>
        parseChannel(channel)
      );
    });

    it("should return the risks within 'latest'", () => {
      expect(createChannelTree(channelList)).toEqual({
        latest: {
          name: "latest",
          risks: {
            stable: {
              name: "stable",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            },
            beta: {
              name: "beta",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            },
            candidate: {
              name: "candidate",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            },
            edge: {
              name: "edge",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            }
          }
        }
      });
    });
  });

  describe("track/risk", () => {
    beforeEach(() => {
      channelList = ["stable", "latest/edge", "test/candidate"].map(channel =>
        parseChannel(channel)
      );
    });
    it("should return 'latest' and others", () => {
      expect(createChannelTree(channelList)).toEqual({
        latest: {
          name: "latest",
          risks: {
            stable: {
              name: "stable",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            },
            edge: {
              name: "edge",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            }
          }
        },
        test: {
          name: "test",
          risks: {
            candidate: {
              name: "candidate",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            }
          }
        }
      });
    });
  });

  describe("risk/branch", () => {
    beforeEach(() => {
      channelList = ["stable", "beta/test", "edge/1.0.1", "edge/hotfix"].map(
        channel => parseChannel(channel)
      );
    });

    it("should return latest tracks with different branches on the tracks", () => {
      expect(createChannelTree(channelList)).toEqual({
        latest: {
          name: "latest",
          risks: {
            stable: {
              name: "stable",
              branches: {
                _base: {
                  name: "_base"
                }
              }
            },
            beta: {
              name: "beta",
              branches: {
                test: {
                  name: "test"
                }
              }
            },
            edge: {
              name: "edge",
              branches: {
                hotfix: {
                  name: "hotfix"
                },
                "1.0.1": {
                  name: "1.0.1"
                }
              }
            }
          }
        }
      });
    });
  });
  describe("mix of risk/branch and risk only", () => {
    beforeEach(() => {
      channelList = [
        "stable",
        "stable/test",
        "stable/1.0.1",
        "stable/hotfix"
      ].map(channel => parseChannel(channel));
    });
    it("should return no branch risk, above all branches", () => {
      expect(createChannelTree(channelList)).toEqual({
        latest: {
          name: "latest",
          risks: {
            stable: {
              name: "stable",
              branches: {
                _base: {
                  name: "_base"
                },
                test: {
                  name: "test"
                },
                "1.0.1": {
                  name: "1.0.1"
                },
                hotfix: {
                  name: "hotfix"
                }
              }
            }
          }
        }
      });
    });
  });
});

describe("sortAlphaNum", () => {
  it("sorts numbers", () => {
    expect(sortAlphaNum(["0", "5", "2", "6", "7", "1", "8"])).toEqual([
      "8",
      "7",
      "6",
      "5",
      "2",
      "1",
      "0"
    ]);
  });

  it("sorts semver", () => {
    expect(sortAlphaNum(["0.0.1", "1.0.1", "2.0.2"])).toEqual([
      "2.0.2",
      "1.0.1",
      "0.0.1"
    ]);
  });

  it("sorts text", () => {
    expect(sortAlphaNum(["aaa", "zzzzz", "cccc", "test"])).toEqual([
      "aaa",
      "cccc",
      "test",
      "zzzzz"
    ]);
  });

  it("sorts a mixture of numbers, semver and text", () => {
    expect(sortAlphaNum(["0.0.1", "5", "zzz", "latest"])).toEqual([
      "latest",
      "zzz",
      "5",
      "0.0.1"
    ]);
  });

  it("puts latest first if isTrack and no defaultTrack", () => {
    expect(sortAlphaNum(["0.0.1", "5", "test", "latest"], "latest")).toEqual([
      "latest",
      "test",
      "5",
      "0.0.1"
    ]);
  });

  it("puts defaultTrack first if isTrack and defaultTrack set", () => {
    expect(sortAlphaNum(["0.0.1", "5", "test", "latest"], "test")).toEqual([
      "test",
      "latest",
      "5",
      "0.0.1"
    ]);
  });
});

describe("sortChannels", () => {
  describe("tracks", () => {
    it("should return in the track order, with latest first", () => {
      expect(
        sortChannels(["zzz/edge", "stable", "1/beta", "5.9.0/candidate"]).tree
      ).toEqual([
        {
          name: "latest",
          risks: [
            {
              name: "stable",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        },
        {
          name: "zzz",
          risks: [
            {
              name: "edge",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        },
        {
          name: "5.9.0",
          risks: [
            {
              name: "candidate",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        },
        {
          name: "1",
          risks: [
            {
              name: "beta",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        }
      ]);
    });
  });

  describe("track/risk", () => {
    it("should return with 'latest' track first, with risks in order of stability", () => {
      expect(
        sortChannels(["zzz/edge", "stable", "1/beta", "1/candidate"]).tree
      ).toEqual([
        {
          name: "latest",
          risks: [
            {
              name: "stable",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        },
        {
          name: "zzz",
          risks: [
            {
              name: "edge",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        },
        {
          name: "1",
          risks: [
            {
              name: "candidate",
              branches: [
                {
                  name: "_base"
                }
              ]
            },
            {
              name: "beta",
              branches: [
                {
                  name: "_base"
                }
              ]
            }
          ]
        }
      ]);
    });
  });

  describe("track/risk/branch", () => {
    describe("'latest' track first, with risks in order of stability, then branches in order", () => {
      it("should return as a tree", () => {
        expect(
          sortChannels([
            "zzz/edge",
            "stable",
            "1/beta/1.0.1",
            "1/beta/hotfix",
            "1/candidate"
          ]).tree
        ).toEqual([
          {
            name: "latest",
            risks: [
              {
                name: "stable",
                branches: [
                  {
                    name: "_base"
                  }
                ]
              }
            ]
          },
          {
            name: "zzz",
            risks: [
              {
                name: "edge",
                branches: [
                  {
                    name: "_base"
                  }
                ]
              }
            ]
          },
          {
            name: "1",
            risks: [
              {
                name: "candidate",
                branches: [
                  {
                    name: "_base"
                  }
                ]
              },
              {
                name: "beta",
                branches: [
                  {
                    name: "hotfix"
                  },
                  {
                    name: "1.0.1"
                  }
                ]
              }
            ]
          }
        ]);
      });
      it("should return as a list", () => {
        expect(
          sortChannels([
            "zzz/edge",
            "stable",
            "1/beta/1.0.1",
            "1/beta/hotfix",
            "1/candidate"
          ]).list
        ).toEqual([
          "stable",
          "zzz/edge",
          "1/candidate",
          "1/beta/hotfix",
          "1/beta/1.0.1"
        ]);
      });
    });
  });

  describe("options", () => {
    describe("defaultTrack", () => {
      it("should return with default track as latest", () => {
        expect(
          sortChannels(["latest/stable", "test/stable"], {
            defaultTrack: "test"
          }).list
        ).toEqual(["test/stable", "latest/stable"]);
      });
    });

    describe("maintainFormat", () => {
      it("should maintain the format", () => {
        expect(
          sortChannels(["test/stable", "stable"], {
            maintainFormat: true
          }).list
        ).toEqual(["stable", "test/stable"]);
      });
    });
  });
});
