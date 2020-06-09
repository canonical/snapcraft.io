import { RISKS } from "./constants";

function getRevisionsMap(revisions) {
  const revisionsMap = {};
  revisions.forEach((rev) => {
    rev.channels = [];
    revisionsMap[rev.revision] = rev;
  });

  return revisionsMap;
}

// init channels data in revision history
function initReleasesData(revisionsMap, releases) {
  // go through releases from older to newest
  releases
    .slice()
    .reverse()
    .forEach((release) => {
      if (release.revision) {
        const rev = revisionsMap[release.revision];

        if (rev) {
          const channel = release.branch
            ? `${release.track}/${release.risk}/${release.branch}`
            : `${release.track}/${release.risk}`;

          if (rev.channels.indexOf(channel) === -1) {
            rev.channels.push(channel);
          }
        }
      }
    });

  return releases;
}

// transforming channel map list data into format used by this component
// https://dashboard.snapcraft.io/docs/v2/en/snaps.html#snap-channel-map
function getReleaseDataFromChannelMap(channelMap, revisionsMap) {
  const releasedChannels = {};

  channelMap.forEach((mapInfo) => {
    if (!releasedChannels[mapInfo.channel]) {
      releasedChannels[mapInfo.channel] = {};
    }

    if (
      !releasedChannels[mapInfo.channel][mapInfo.architecture] &&
      revisionsMap[mapInfo.revision]
    ) {
      releasedChannels[mapInfo.channel][mapInfo.architecture] =
        revisionsMap[mapInfo.revision];
      releasedChannels[mapInfo.channel][mapInfo.architecture].expiration =
        mapInfo["expiration-date"];
    }
  });

  return releasedChannels;
}

// for channel without release get next (less risk) channel with a release
function getTrackingChannel(releasedChannels, track, risk, arch) {
  let tracking = null;
  // if there is no revision for this arch in given channel (track/risk)
  if (
    !(
      releasedChannels[`${track}/${risk}`] &&
      releasedChannels[`${track}/${risk}`][arch]
    )
  ) {
    // find the next channel that has any revision
    for (let i = RISKS.indexOf(risk); i >= 0; i--) {
      const trackingChannel = `${track}/${RISKS[i]}`;

      if (
        releasedChannels[trackingChannel] &&
        releasedChannels[trackingChannel][arch]
      ) {
        tracking = trackingChannel;
        break;
      }
    }
  }

  return tracking;
}

function getUnassignedRevisions(revisionsMap, arch) {
  let filteredRevisions = Object.values(revisionsMap).reverse();
  if (arch) {
    filteredRevisions = filteredRevisions.filter((revision) => {
      return (
        revision.architectures.includes(arch) &&
        (!revision.channels || revision.channels.length === 0)
      );
    });
  }
  return filteredRevisions;
}

export {
  getUnassignedRevisions,
  getTrackingChannel,
  getRevisionsMap,
  initReleasesData,
  getReleaseDataFromChannelMap,
};
