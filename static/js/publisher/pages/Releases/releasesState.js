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
function initReleasesData(revisionsMap, releases, channelMap) {
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

          // Technically, we should not modify the release object,
          // but to simplify other parts of the code, we do it
          // here - nice and early during initialization.
          // It's double nasty, because we're actually modifying
          // the revision, not the release.
          // Sorry, love Luke xox.
          release.isProgressive = false;
          if (release.progressive && release.progressive.percentage) {
            release.isProgressive = true;

            // Based on the note at the top of
            // https://dashboard.snapcraft.io/docs/reference/v1/snap.html#progressive-releases
            // We need to get the channelMap to hydrate the current percentage
            if (channelMap) {
              const currentChannel = channelMap.find(
                (c) => c.channel === channel && c.revision === release.revision,
              );

              if (currentChannel) {
                release.progressive["current-percentage"] =
                  currentChannel.progressive["current-percentage"];
                  if (currentChannel.progressive.percentage !== release.progressive.percentage) {
                    release.progressive.percentage =
                      currentChannel.progressive.percentage || 100;
                  }
              }
            }
          }

          if (!rev.releases) {
            rev.releases = [];
          }

          rev.releases.unshift(release);
        }
      }
    });

  return releases;
}

// Get specific revision based on snapName and a channelMap object
function fetchMissingRevision(snapName, info) {
  return fetch(`/${snapName}/releases/revision/${info.revision}`)
    .then((res) => res.json())
    .then((revision) => ({
      info,
      revision: revision.revision,
    }));
}

// transforming channel map list data into format used by this component
// https://dashboard.snapcraft.io/docs/v2/en/snaps.html#snap-channel-map
function getReleaseDataFromChannelMap(channelMap, revisionsMap, snapName) {
  return new Promise((resolve) => {
    const releasedChannels = {};
    const missingRevisions = [];

    channelMap.forEach((mapInfo) => {
      if (!releasedChannels[mapInfo.channel]) {
        releasedChannels[mapInfo.channel] = {};
      }

      if (!releasedChannels[mapInfo.channel][mapInfo.architecture]) {
        const revisionInfo = revisionsMap.find(
          (r) => r.revision === mapInfo.revision,
        );
        if (revisionInfo) {
          releasedChannels[mapInfo.channel][mapInfo.architecture] =
            revisionInfo;
          releasedChannels[mapInfo.channel][mapInfo.architecture].expiration =
            mapInfo["expiration-date"];
          releasedChannels[mapInfo.channel][mapInfo.architecture].progressive =
            mapInfo["progressive"];
        } else {
          missingRevisions.push(fetchMissingRevision(snapName, mapInfo));
        }
      }
    });

    if (missingRevisions.length > 0) {
      Promise.all(missingRevisions)
        .then((revs) => {
          revs.forEach((rev) => {
            const { info, revision } = rev;
            releasedChannels[info.channel][info.architecture] = revision;
            releasedChannels[info.channel][info.architecture].expiration =
              revision["expiration-date"];
          });

          resolve([releasedChannels, revs.map((r) => r.revision)]);
        })
        .catch(() => {
          // if a call doesn't work for whatever reason
          resolve([releasedChannels, []]);
        });
    } else {
      resolve([releasedChannels, []]);
    }
  });
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
  getReleaseDataFromChannelMap,
  getRevisionsMap,
  getTrackingChannel,
  getUnassignedRevisions,
  initReleasesData,
};
