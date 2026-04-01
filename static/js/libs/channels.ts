const RISKS = ["stable", "candidate", "beta", "edge"];

export type ChannelObject = {
  track?: string;
  risk?: string;
  branch?: string | null;
  format?: {
    track: boolean;
    risk: boolean;
    branch: boolean;
  };
};

export type ChannelOptions = {
  defaultTrack: string;
};

export type ChannelTree = {
  [track: string]: TrackObject;
};

type TrackObject = {
  name: string;
  risks: RiskObject[];
};

type RiskObject = {
  name: string;
  branches: string[];
};

/**
 * Parse a channel string into a ChannelObject.
 */
function parseChannel(
  channelString: string,
  options?: ChannelOptions,
): ChannelObject {
  const format = {
    track: false,
    risk: false,
    branch: false,
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
    format: format,
  };
}

/**
 * Create a tree from a list of channels.
 */
function createChannelTree(channelList: ChannelObject[]) {
  const tracks: ChannelTree = {};

  channelList.forEach((channel) => {
    if (channel.track) {
      if (!tracks[channel.track]) {
        tracks[channel.track] = {
          name: channel.track,
          risks: [],
        };
      }
      const track = tracks[channel.track];
      if (channel.risk) {
        let risk = track.risks.find((riskObj) => riskObj.name === channel.risk);
        if (!risk) {
          const newRisk = {
            name: channel.risk,
            branches: [],
          };
          track.risks.push(newRisk);
          risk = newRisk;
        }
        if (channel.branch) {
          risk.branches.push(channel.branch);
        }
      }
    }
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
 */
function sortAlphaNum(list: string[], hoistValue?: string): string[] {
  const numbers: string[] = [];
  const hoistList: string[] = [];
  let strings: string[] = [];
  list.forEach((item) => {
    // numbers are defined by any string starting any of the following patterns:
    //   just a number – 1,2,3,4,
    //   numbers on the left in a pattern – 2018.3 , 1.1, 1.1.23 ...
    //   or numbers on the left with strings at the end – 1.1-hotfix
    if (hoistValue && item === hoistValue) {
      hoistList.push(item);
    } else if (isNaN(parseInt(item.slice(0, 1)))) {
      strings.push(item);
    } else {
      numbers.push(item);
    }
  });

  // Ignore case
  strings.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  strings = hoistList.concat(strings);

  // Sort numbers (that are actually strings)
  numbers.sort((a, b) => {
    return b.localeCompare(a, undefined, {
      numeric: true,
      sensitivity: "base",
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
 */
function sortChannels(channels: string[], options?: { defaultTrack: string }) {
  const channelList = channels.map((channel) => parseChannel(channel, options));
  const channelTree = createChannelTree(channelList);

  const sortedByTrack: TrackObject[] = [];

  let track = "latest";
  if (options && options.defaultTrack) {
    track = options.defaultTrack;
  }

  const trackOrder = sortAlphaNum(Object.keys(channelTree), track);

  trackOrder.forEach((track) => {
    sortedByTrack.push(channelTree[track]);
  });

  sortedByTrack.forEach((track) => {
    track.risks.sort((a, b) => {
      return RISKS.indexOf(a.name) - RISKS.indexOf(b.name);
    });

    track.risks.forEach((risk) => {
      const branchOrder = sortAlphaNum(risk.branches, "_base");
      risk.branches.sort((a, b) => {
        return branchOrder.indexOf(a) - branchOrder.indexOf(b);
      });
    });
  });

  const toArray = () => {
    const result: string[] = [];
    sortedByTrack.forEach((track) => {
      if (track.risks) {
        track.risks.forEach((risk) => {
          if (
            risk.branches.length > 1 ||
            (risk.branches.length === 1 && risk.branches[0] !== "_base")
          ) {
            risk.branches.forEach((branch) => {
              const format = channelList.find(
                (item) =>
                  item.track === track.name &&
                  item.risk === risk.name &&
                  item.branch === branch,
              )?.format;
              const str = [];
              if (format?.track) {
                str.push(track.name);
              }
              if (format?.risk) {
                str.push(risk.name);
              }
              if (format?.branch) {
                str.push(branch);
              }
              result.push(str.join("/"));
            });
          } else {
            const format = channelList.find((item) => {
              return item.track === track.name && item.risk === risk.name;
            })?.format;
            const str = [];
            if (format?.track) {
              str.push(track.name);
            }
            if (format?.risk) {
              str.push(risk.name);
            }
            result.push(str.join("/"));
          }
        });
      }
    });
    return result;
  };

  return {
    tree: sortedByTrack,
    list: toArray(),
  };
}

/**
 * Get a channel string based on an object containing track, risk and branch
 */
function getChannelString(channelObj: ChannelObject): string {
  return `${channelObj.track ? `${channelObj.track}/` : ""}${channelObj.risk}${
    channelObj.branch ? `/${channelObj.branch}` : ""
  }`;
}

export {
  sortChannels,
  parseChannel,
  createChannelTree,
  sortAlphaNum,
  getChannelString,
};
