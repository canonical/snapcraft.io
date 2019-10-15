const RISKS = ["stable", "candidate", "beta", "edge"];

/**
 * Parse a channel string into an object
 * @param {string} channelString
 * @param {{defaultTrack: string}} options
 * @returns {{format: {risk: boolean, track: boolean, branch: boolean}, risk: *, track: (string|*), branch: (string|*)}}
 */
function parseChannel(channelString, options) {
  const format = {
    track: false,
    risk: false,
    branch: false
  };
  const channelArr = ["latest", undefined, "_base"];

  if (options) {
    if (options.defaultTrack) {
      channelArr[0] = options.defaultTrack;
    }
  }

  const parts = channelString.split("/");
  if (parts.length === 1) {
    channelArr[1] = channelString;
    format.risk = true;
  } else if (parts.length === 2) {
    if (RISKS.indexOf(parts[0]) === -1) {
      channelArr[0] = parts[0];
      channelArr[1] = parts[1];
      format.track = true;
      format.risk = true;
    } else {
      channelArr[1] = parts[0];
      channelArr[2] = parts[1];
      format.risk = true;
      format.branch = true;
    }
  } else if (parts.length === 3) {
    channelArr[0] = parts[0];
    channelArr[1] = parts[1];
    channelArr[2] = parts[2];
    format.track = true;
    format.risk = true;
    format.branch = true;
  }

  return {
    track: channelArr[0],
    risk: channelArr[1],
    branch: channelArr[2],
    format: format
  };
}

/**
 * Create a tree from a list of channels
 * @param {[{track: string, risk: string, branch: string, format: {track: boolean, branch: boolean, format: boolean}}]} channelList
 * @returns {{
 *    track: {
 *      name: string,
 *      risks: {
 *        risk: {
 *          name: string,
 *          branches: {
 *            branch: {
 *              name: string
 *            }
 *          }
 *        }
 *      }
 *    }
 *  }}
 */
function createChannelTree(channelList) {
  const tracks = {};

  channelList.forEach(channel => {
    if (!tracks[channel.track]) {
      tracks[channel.track] = {
        name: channel.track,
        risks: {}
      };
    }

    let level = tracks[channel.track];

    if (!level.risks[channel.risk]) {
      level.risks[channel.risk] = {
        name: channel.risk
      };
    }

    level = level.risks[channel.risk];

    if (!level.branches) {
      level.branches = {};
    }

    level.branches[channel.branch] = {
      name: channel.branch
    };
  });

  return tracks;
}

/**
 * Sort a list of strings
 * The output order will be:
 *  - hoistValue
 *  - strings
 *    - ascending
 *  - numbers
 *    - descending
 * @param {[string]} list
 * @param {string} hoistValue A value to always appear at the top
 * @returns {*[]}
 */
function sortAlphaNum(list, hoistValue) {
  let numbers = [];
  let strings = [];
  let hoistList = [];
  list.forEach(item => {
    // numbers are defined by any string starting any of the following patterns:
    //   just a number – 1,2,3,4,
    //   numbers on the left in a pattern – 2018.3 , 1.1, 1.1.23 ...
    //   or numbers on the left with strings at the end – 1.1-hotfix
    if (hoistValue && item === hoistValue) {
      hoistList.push(item);
    } else if (isNaN(parseInt(item.substr(0, 1)))) {
      strings.push(item);
    } else {
      numbers.push(item);
    }
  });

  // Ignore case
  strings.sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  strings = hoistList.concat(strings);

  // Sort numbers (that are actually strings)
  numbers.sort((a, b) => {
    return b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });

  // Join the arrays together again
  return strings.concat(numbers);
}

/**
 * Sort channels into the following format:
 * defaultTrack/stable
 * defaultTrack/stable/branches
 * defaultTrack/candidate
 * defaultTrack/candidate/branches
 * defaultTrack/beta
 * defaultTrack/beta/branches
 * defaultTrack/edge
 * defaultTrack/edge/branches
 * track/stable
 * track/stable/branches
 * ...
 *
 * @param {[string]} channels An array of "risk" / "track/risk" / "track/risk/branch"
 * @param {{defaultTrack: string}} options
 * @returns {{tree: Array, list: Array}}
 */
function sortChannels(channels, options) {
  const channelList = channels.map(channel => parseChannel(channel, options));
  const channelTree = createChannelTree(channelList);

  const sortedByTrack = [];

  let track = "latest";
  if (options && options.defaultTrack) {
    track = options.defaultTrack;
  }

  const trackOrder = sortAlphaNum(Object.keys(channelTree), track);

  trackOrder.forEach(track => {
    sortedByTrack.push(channelTree[track]);
  });

  sortedByTrack.map(track => {
    const riskOrder = Object.keys(track.risks).sort((a, b) => {
      return RISKS.indexOf(a) - RISKS.indexOf(b);
    });

    track.risks = riskOrder.map(risk => track.risks[risk]);

    track.risks.map(risk => {
      const branchOrder = sortAlphaNum(Object.keys(risk.branches), "_base");

      risk.branches = branchOrder.map(branch => risk.branches[branch]);

      return risk;
    });

    return track;
  });

  const toArray = () => {
    const list = [];
    sortedByTrack.forEach(track => {
      if (track.risks) {
        track.risks.forEach(risk => {
          if (risk.branches.length > 1 || risk.branches[0].name !== "_base") {
            risk.branches.forEach(branch => {
              const format = channelList.filter(
                item =>
                  item.track === track.name &&
                  item.risk === risk.name &&
                  item.branch === branch.name
              )[0].format;
              const str = [];
              if (format.track) {
                str.push(track.name);
              }
              if (format.risk) {
                str.push(risk.name);
              }
              if (format.branch) {
                str.push(branch.name);
              }
              list.push(str.join("/"));
            });
          } else {
            const format = channelList.filter(item => {
              return item.track === track.name && item.risk === risk.name;
            })[0].format;
            const str = [];
            if (format.track) {
              str.push(track.name);
            }
            if (format.risk) {
              str.push(risk.name);
            }
            list.push(str.join("/"));
          }
        });
      }
    });

    return list;
  };

  return {
    tree: sortedByTrack,
    list: toArray()
  };
}

/**
 * Get a channel string based on an object containing track, risk and branch
 *
 * @param {track: string, risk: string, branch: string} channelObj
 * @returns string
 */
function getChannelString(channelObj) {
  return `${channelObj.track}/${channelObj.risk}${
    channelObj.branch ? `/${channelObj.branch}` : ""
  }`;
}

export {
  sortChannels,
  parseChannel,
  createChannelTree,
  sortAlphaNum,
  getChannelString
};
