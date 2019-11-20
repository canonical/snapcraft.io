import { parse, isAfter, differenceInDays } from "date-fns";
import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD
} from "../constants";
import { isInDevmode, getBuildId, isRevisionBuiltOnLauchpad } from "../helpers";
import { sortAlphaNum, getChannelString } from "../../../libs/channels";

// returns true if isProgressiveReleaseEnabled feature flag is enabled
export function isProgressiveReleaseEnabled(state) {
  return !!state.options.flags.isProgressiveReleaseEnabled;
}

// returns release history filtered by history filters
export function getFilteredReleaseHistory(state) {
  const releases = state.releases;
  const revisions = state.revisions;
  const filters = state.history.filters;

  return (
    releases
      // only releases of revisions (ignore closing channels)
      .filter(release => release.revision)
      // only releases in given architecture
      .filter(release => {
        return filters && filters.arch
          ? release.architecture === filters.arch
          : true;
      })
      // only releases in given track
      .filter(release => {
        return filters && filters.track
          ? release.track === filters.track
          : true;
      })
      // only releases in given risk
      .filter(release => {
        return filters && filters.risk ? release.risk === filters.risk : true;
      })
      // only releases without a branch, or a given branch
      .filter(release => {
        return filters && filters.branch
          ? release.branch === filters.branch
          : true;
      })
      // only one latest release of every revision
      .filter((release, index, all) => {
        return all.findIndex(r => r.revision === release.revision) === index;
      })
      // map release history to revisions
      .map(release => {
        return {
          ...revisions[release.revision],
          release
        };
      })
  );
}

// returns list of selected revisions, to know which ones to render selected
export function getSelectedRevisions(state) {
  if (state.channelMap[AVAILABLE]) {
    return Object.values(state.channelMap[AVAILABLE]).map(
      revision => revision.revision
    );
  }

  return [];
}

// return selected revision for given architecture
export function getSelectedRevision(state, arch) {
  if (state.channelMap[AVAILABLE]) {
    return state.channelMap[AVAILABLE][arch];
  }
}

// returns list of selected architectures
export function getSelectedArchitectures(state) {
  if (state.channelMap[AVAILABLE]) {
    return Object.keys(state.channelMap[AVAILABLE]);
  }

  return [];
}

// return true if there are any devmode revisions in the state
export function hasDevmodeRevisions(state) {
  return Object.values(state.channelMap).some(archReleases => {
    return Object.values(archReleases).some(isInDevmode);
  });
}

// get channel map data updated with any pending releases
export function getPendingChannelMap(state) {
  const { channelMap, pendingReleases } = state;
  const pendingChannelMap = JSON.parse(JSON.stringify(channelMap));

  // for each release
  Object.keys(pendingReleases).forEach(releasedRevision => {
    Object.keys(pendingReleases[releasedRevision]).forEach(channel => {
      const revision = pendingReleases[releasedRevision][channel].revision;

      if (!pendingChannelMap[channel]) {
        pendingChannelMap[channel] = {};
      }

      revision.architectures.forEach(arch => {
        pendingChannelMap[channel][arch] = revision;
      });
    });
  });

  return pendingChannelMap;
}

// get all revisions ordered from newest (based on revsion id)
export function getAllRevisions(state) {
  return Object.values(state.revisions).reverse();
}

// get all revisions not released to any channel yet
export function getUnreleasedRevisions(state) {
  return getAllRevisions(state).filter(
    revision => !revision.channels || revision.channels.length === 0
  );
}

// get unreleased revisions not older then 7 days
export function getRecentRevisions(state) {
  const interval = 1000 * 60 * 60 * 24 * 7; // 7 days
  return getUnreleasedRevisions(state).filter(
    r => Date.now() - new Date(r.created_at).getTime() < interval
  );
}

// return list of revisions based on given selection value
export function getAvailableRevisionsBySelection(state, value) {
  switch (value) {
    case AVAILABLE_REVISIONS_SELECT_RECENT:
      return getRecentRevisions(state);
    case AVAILABLE_REVISIONS_SELECT_UNRELEASED:
      return getUnreleasedRevisions(state);
    case AVAILABLE_REVISIONS_SELECT_LAUNCHPAD:
      return getLaunchpadRevisions(state);
    default:
      return getAllRevisions(state);
  }
}

// return list of revisions based on current availableRevisionsSelect value
export function getFilteredAvailableRevisions(state) {
  const { availableRevisionsSelect } = state;
  return getAvailableRevisionsBySelection(state, availableRevisionsSelect);
}

// return list of revisions based on current availableRevisionsSelect value
// filtered by arch (can't be memoized)
export function getFilteredAvailableRevisionsForArch(state, arch) {
  return getFilteredAvailableRevisions(state).filter(revision =>
    revision.architectures.includes(arch)
  );
}

// get list of architectures of uploaded revisions
export function getArchitectures(state) {
  let archs = [];

  getAllRevisions(state).forEach(revision => {
    archs = archs.concat(revision.architectures);
  });

  // make archs unique and sorted
  archs = archs.filter((item, i, ar) => ar.indexOf(item) === i);

  return archs.sort();
}

export function getTracks(state) {
  let tracks = [];

  state.releases.map(t => t.track).forEach(track => {
    // if we haven't saved it yet
    if (tracks.indexOf(track) === -1) {
      tracks.push(track);
    }
  });

  return sortAlphaNum(tracks, "latest");
}

export function getBranches(state) {
  let branches = [];
  const { currentTrack } = state;

  const now = parse(Date.now());

  state.releases
    .filter(t => t.branch && t.track === currentTrack)
    .sort((a, b) => {
      return isAfter(parse(b.when), parse(a.when));
    })
    .forEach(({ track, risk, branch, when, revision }) => {
      const exists =
        branches.filter(
          b => b.track === track && b.risk === risk && b.branch === branch
        ).length > 0;
      if (!exists) {
        branches.push({
          track,
          risk,
          branch,
          revision,
          when
        });
      }
    });

  return branches
    .filter(b => {
      return differenceInDays(now, parse(b.when)) <= 30;
    })
    .reverse();
}

// return true if there is a pending release in given channel for given arch
export function hasPendingRelease(state, channel, arch) {
  const { channelMap } = state;
  const pendingChannelMap = getPendingChannelMap(state);

  // current revision to show (released or pending)
  let currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];
  // already released revision
  let releasedRevision = channelMap[channel] && channelMap[channel][arch];

  // check if there is a pending release in this cell
  return (
    currentRevision &&
    (!releasedRevision ||
      releasedRevision.revision !== currentRevision.revision)
  );
}

export function getTrackRevisions({ channelMap }, track) {
  const trackKeys = Object.keys(channelMap).filter(
    trackName => trackName.indexOf(track) == 0
  );
  return trackKeys.map(trackName => channelMap[trackName]);
}

// return true if any revision has build-request-id attribute
export function hasBuildRequestId(state) {
  return getAllRevisions(state).some(revision => getBuildId(revision));
}

// return revisions built by launchpad
export function getLaunchpadRevisions(state) {
  return getAllRevisions(state).filter(isRevisionBuiltOnLauchpad);
}

export function getRevisionsFromBuild(state, buildId) {
  return getAllRevisions(state).filter(
    revision => getBuildId(revision) === buildId
  );
}

// return an array of 3 items:
// [
//    current progressive release status,
//    the previous revision number,
//    the progressive release status of a pending release of the same release
// ]
export function getProgressiveState(state, channel, arch, revision) {
  if (!isProgressiveReleaseEnabled(state)) {
    return [null, null, null];
  }

  const { releases, pendingReleases, revisions } = state;

  let progressiveStatus = null;
  let previousRevision = null;
  let pendingProgressiveStatus = null;

  const allReleases = releases.filter(
    item => channel === getChannelString(item) && arch === item.architecture
  );

  const releaseIndex = allReleases.findIndex(
    item => revision === item.revision
  );

  const release = allReleases[releaseIndex];

  if (
    release &&
    release.progressive &&
    release.progressive &&
    release.progressive.key
  ) {
    progressiveStatus = JSON.parse(JSON.stringify(release.progressive));

    previousRevision = allReleases
      .slice(releaseIndex)
      .filter(item => item.revision !== release.revision);

    if (previousRevision[0]) {
      previousRevision = revisions[previousRevision[0].revision];
    }
  }

  const pendingMatch = pendingReleases[revision]
    ? pendingReleases[revision][channel]
    : undefined;

  if (pendingMatch) {
    if (
      channel === pendingMatch.channel &&
      pendingMatch.revision.architectures.includes(arch)
    ) {
      pendingProgressiveStatus = Object.assign({}, pendingMatch.progressive);
    }
  }

  return [progressiveStatus, previousRevision, pendingProgressiveStatus];
}

// Is the latest release for a channel & architecture a valid revision?
export function hasRelease(state, channel, architecture) {
  const { releases } = state;
  const filteredReleases = releases.filter(
    release =>
      release.architecture === architecture &&
      getChannelString(release) === channel
  );

  return filteredReleases &&
    filteredReleases[0] &&
    filteredReleases[0].revision !== null
    ? true
    : false;
}

// Separate pendingRelease actions
export function getSeparatePendingReleases(state) {
  const { pendingReleases, releases } = state;
  const isProgressiveEnabled = isProgressiveReleaseEnabled(state);

  const progressiveUpdates = {};
  const newReleases = {};
  const newReleasesToProgress = {};
  const cancelProgressive = {};

  Object.keys(pendingReleases).forEach(revId => {
    Object.keys(pendingReleases[revId]).forEach(channel => {
      const pendingRelease = pendingReleases[revId][channel];
      const releaseCopy = JSON.parse(JSON.stringify(pendingRelease));

      if (isProgressiveEnabled && pendingRelease.replaces) {
        const oldRelease = pendingRelease.replaces;
        cancelProgressive[
          `${oldRelease.revision.revision}-${channel}`
        ] = oldRelease;
      } else if (isProgressiveEnabled && pendingRelease.progressive) {
        // What are the differences between the previous progressive state
        // and the new state.
        const previousState = releaseCopy.revision.release
          ? releaseCopy.revision.release.progressive
          : {};
        const newState = releaseCopy.progressive;

        const changes = [];
        if (newState.paused !== previousState.paused) {
          changes.push({
            key: "paused",
            value: newState.paused
          });
        }

        if (newState.percentage !== previousState.percentage) {
          changes.push({
            key: "percentage",
            value: newState.percentage
          });
        }

        if (changes.length > 0) {
          // Add this to the copy of the pendingRelease state
          releaseCopy.progressive.changes = changes;
          progressiveUpdates[`${revId}-${channel}`] = releaseCopy;
        }
      } else {
        const currentRelease = releases.filter(
          release =>
            release.architecture === releaseCopy.revision.architectures[0] &&
            getChannelString(release) === releaseCopy.channel
        );

        if (
          isProgressiveEnabled &&
          currentRelease[0] &&
          currentRelease[0].revision
        ) {
          newReleasesToProgress[`${revId}-${channel}`] = releaseCopy;
        } else {
          newReleases[`${revId}-${channel}`] = releaseCopy;
        }
      }
    });
  });

  return {
    progressiveUpdates,
    newReleases,
    newReleasesToProgress,
    cancelProgressive
  };
}
