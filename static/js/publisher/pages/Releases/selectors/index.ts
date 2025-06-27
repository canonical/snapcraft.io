import { isAfter, differenceInDays, parseISO } from "date-fns";
import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../constants";
import {
  isInDevmode,
  getBuildId,
  isRevisionBuiltOnLauchpad,
  jsonClone,
} from "../helpers";
import { sortAlphaNum, getChannelString } from "../../../../libs/channels";
import { CombinedState } from "redux";

// returns true if isProgressiveReleaseEnabled feature flag is enabled
export function isProgressiveReleaseEnabled(state: {
  options: any;
  "__@$CombinedState@14396"?: any;
  architectures?: any;
  availableRevisionsSelect?: any;
  branches?: any;
  channelMap?: any;
  currentTrack?: any;
  defaultTrack?: any;
  history?: any;
  modal?: any;
  notification?: any;
  pendingCloses?: any;
  pendingReleases?: any;
  revisions?: any;
  releases?: any;
}) {
  return !!state.options.flags.isProgressiveReleaseEnabled;
}

// returns release history filtered by history filters
export function getFilteredReleaseHistory(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  const releases = state.releases;
  const revisions = state.revisions;
  const filters = state.history.filters;

  return (
    releases
      // only releases of revisions (ignore closing channels)
      .filter((release) => release.revision)
      // only releases in given architecture
      .filter((release) => {
        return filters && filters.arch
          ? release.architecture === filters.arch
          : true;
      })
      // only releases in given track
      .filter((release) => {
        return filters && filters.track
          ? release.track === filters.track
          : true;
      })
      // only releases in given risk
      .filter((release) => {
        return filters && filters.risk ? release.risk === filters.risk : true;
      })
      // only releases without a branch, or a given branch
      .filter((release) => {
        return filters && filters.branch
          ? release.branch === filters.branch
          : true;
      })
      // only one latest release of every revision
      .filter((release, index, all) => {
        return all.findIndex((r) => r.revision === release.revision) === index;
      })
      // map release history to revisions
      .map((release) => {
        return {
          ...revisions[release.revision],
          release,
        };
      })
  );
}

// returns list of selected revisions, to know which ones to render selected
export function getSelectedRevisions(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  if (state.channelMap[AVAILABLE]) {
    return Object.values(state.channelMap[AVAILABLE]).map(
      (revision: any) => revision.revision,
    );
  }

  return [];
}

// return selected revision for given architecture
export function getSelectedRevision(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
  arch: string,
) {
  if (state.channelMap[AVAILABLE]) {
    return state.channelMap[AVAILABLE][arch];
  }
}

// returns list of selected architectures
export function getSelectedArchitectures(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  if (state.channelMap[AVAILABLE]) {
    return Object.keys(state.channelMap[AVAILABLE]);
  }

  return [];
}

// return true if there are any devmode revisions in the state
export function hasDevmodeRevisions(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  return Object.values(state.channelMap).some((archReleases: any) => {
    return Object.values(archReleases).some(isInDevmode);
  });
}

// get channel map data updated with any pending releases
export function getPendingChannelMap(state: {
  channelMap: any;
  pendingReleases: any;
}) {
  const { channelMap, pendingReleases } = state;
  const pendingChannelMap = jsonClone(channelMap);

  // for each release
  Object.keys(pendingReleases).forEach((releasedRevision) => {
    Object.keys(pendingReleases[releasedRevision]).forEach((channel) => {
      const revision = pendingReleases[releasedRevision][channel].revision;

      if (!pendingChannelMap[channel]) {
        pendingChannelMap[channel] = {};
      }

      revision.architectures.forEach((arch: string | number) => {
        pendingChannelMap[channel][arch] = revision;
      });
    });
  });

  return pendingChannelMap;
}

// get all revisions ordered from newest (based on revsion id)
export function getAllRevisions(state: {
  revisions: { [s: string]: unknown } | ArrayLike<unknown>;
}) {
  return Object.values(state.revisions).reverse();
}

// get all revisions not released to any channel yet
export function getUnreleasedRevisions(state: {
  revisions: ArrayLike<unknown> | { [s: string]: unknown };
}) {
  return getAllRevisions(state).filter(
    (revision: any) => !revision.channels || revision.channels.length === 0,
  );
}

// get unreleased revisions not older then 7 days
export function getRecentRevisions(state: {
  revisions: ArrayLike<unknown> | { [s: string]: unknown };
}) {
  const interval = 1000 * 60 * 60 * 24 * 7; // 7 days
  return getUnreleasedRevisions(state).filter(
    (r: any) => Date.now() - new Date(r.created_at).getTime() < interval,
  );
}

// return list of revisions based on given selection value
export function getAvailableRevisionsBySelection(
  state: {
    revisions:
      | ArrayLike<unknown>
      | { [s: string]: unknown }
      | { [s: string]: unknown }
      | { [s: string]: unknown };
  },
  value: any,
) {
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
export function getFilteredAvailableRevisions(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  const { availableRevisionsSelect } = state;
  return getAvailableRevisionsBySelection(state, availableRevisionsSelect);
}

// return list of revisions based on current availableRevisionsSelect value
// filtered by arch (can't be memoized)
export function getFilteredAvailableRevisionsForArch(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
  arch: string,
) {
  return getFilteredAvailableRevisions(state).filter((revision: any) =>
    revision.architectures.includes(arch),
  );
}

// get list of architectures of uploaded revisions
export function getArchitectures(state: {
  architectures: any;
  "__@$CombinedState@14396"?: any;
  availableRevisionsSelect?: any;
  branches?: any;
  channelMap?: any;
  currentTrack?: any;
  defaultTrack?: any;
  history?: any;
  modal?: any;
  notification?: any;
  options?: any;
  pendingCloses?: any;
  pendingReleases?: any;
  revisions?: any;
  releases?: any;
}) {
  return state.architectures && state.architectures.length > 0
    ? state.architectures.sort()
    : [];
}

export function getTracks(state: {
  options: any;
  "__@$CombinedState@14396"?: any;
  architectures?: any;
  availableRevisionsSelect?: any;
  branches?: any;
  channelMap?: any;
  currentTrack?: any;
  defaultTrack?: any;
  history?: any;
  modal?: any;
  notification?: any;
  pendingCloses?: any;
  pendingReleases?: any;
  revisions?: any;
  releases?: any;
}) {
  let tracks = [];

  tracks = state.options.tracks.map((track: { name: any }) => track.name);

  // @ts-ignore
  return sortAlphaNum([...new Set(tracks)], "latest");
}

export function getBranches(state: { currentTrack: any; releases: any }) {
  const branches: Array<any> = [];
  const { currentTrack, releases } = state;

  const now = Date.now();

  releases
    .filter((t: any) => t.branch && t.track === currentTrack)
    .sort((a: { when: string }, b: { when: string }) => {
      return isAfter(parseISO(b.when), parseISO(a.when));
    })
    .forEach(
      (item: {
        [x: string]: any;
        track?: any;
        risk?: any;
        branch?: any;
        when?: any;
        revision?: any;
      }) => {
        const { track, risk, branch, when, revision } = item;
        const exists =
          branches.filter(
            (b: any) =>
              b.track === track && b.risk === risk && b.branch === branch,
          ).length > 0;

        if (!exists) {
          branches.push({
            track,
            risk,
            branch,
            revision,
            when,
            expiration: item["expiration-date"],
          });
        }
      },
    );

  return branches
    .filter((b) => {
      return differenceInDays(parseISO(b.expiration), now) > 0;
    })
    .reverse();
}

// return true if there is a pending release in given channel for given arch
export function hasPendingRelease(state: any, channel: string, arch: string) {
  const { channelMap } = state;
  const pendingChannelMap = getPendingChannelMap(state);

  // current revision to show (released or pending)
  const currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];
  // already released revision
  const releasedRevision = channelMap[channel] && channelMap[channel][arch];

  // check if there is a pending release in this cell
  return (
    currentRevision &&
    (!releasedRevision ||
      releasedRevision.revision !== currentRevision.revision)
  );
}

export function getTrackRevisions(
  {
    channelMap,
  }: {
    channelMap: any;
  },
  track: string,
) {
  const trackKeys = Object.keys(channelMap).filter(
    (trackName) => trackName.indexOf(track) == 0,
  );
  return trackKeys.map((trackName) => channelMap[trackName]);
}

// return true if any revision has build-request-id attribute
export function hasBuildRequestId(state: {
  revisions:
    | { [s: string]: unknown }
    | ArrayLike<unknown>
    | {
        1: { revision: number; version: string };
        2: { revision: number; version: string };
        3: { revision: number; version: string };
      }
    | {
        4: {
          revision: number;
          version: string;
          attributes: { "build-request-id": string };
        };
        1: { revision: number; version: string };
        2: { revision: number; version: string };
        3: { revision: number; version: string };
      };
  "__@$CombinedState@14396"?: any;
  architectures?: any;
  availableRevisionsSelect?: any;
  branches?: any;
  channelMap?: any;
  currentTrack?: any;
  defaultTrack?: any;
  history?: any;
  modal?: any;
  notification?: any;
  options?: any;
  pendingCloses?: any;
  pendingReleases?: any;
  releases?: any;
}) {
  return getAllRevisions(state).some((revision: any) => getBuildId(revision));
}

// return revisions built by launchpad
export function getLaunchpadRevisions(state: {
  revisions:
    | ArrayLike<unknown>
    | { [s: string]: unknown }
    | { [s: string]: unknown }
    | { [s: string]: unknown }
    | { [s: string]: unknown }
    | {
        1: { revision: number; version: string };
        2: { revision: number; version: string };
        3: {
          revision: number;
          version: string;
          attributes: { "build-request-id": string };
        };
        4: {
          revision: number;
          version: string;
          attributes: { "build-request-id": string };
        };
      };
  "__@$CombinedState@14396"?: any;
  architectures?: any;
  availableRevisionsSelect?: any;
  branches?: any;
  channelMap?: any;
  currentTrack?: any;
  defaultTrack?: any;
  history?: any;
  modal?: any;
  notification?: any;
  options?: any;
  pendingCloses?: any;
  pendingReleases?: any;
  releases?: any;
}) {
  return getAllRevisions(state).filter(isRevisionBuiltOnLauchpad);
}

export function getRevisionsFromBuild(
  state: {
    revisions:
      | ArrayLike<unknown>
      | { [s: string]: unknown }
      | {
          1: { revision: number; version: string };
          2: { revision: number; version: string };
          3: {
            revision: number;
            version: string;
            attributes: { "build-request-id": string };
          };
          4: {
            revision: number;
            version: string;
            attributes: { "build-request-id": string };
          };
          5: {
            revision: number;
            version: string;
            attributes: { "build-request-id": string };
          };
        };
    "__@$CombinedState@14396"?: any;
    architectures?: any;
    availableRevisionsSelect?: any;
    branches?: any;
    channelMap?: any;
    currentTrack?: any;
    defaultTrack?: any;
    history?: any;
    modal?: any;
    notification?: any;
    options?: any;
    pendingCloses?: any;
    pendingReleases?: any;
    releases?: any;
  },
  buildId: string,
) {
  return getAllRevisions(state).filter(
    (revision: any) => getBuildId(revision) === buildId,
  );
}

// return an array of 2 items:
// [
//    the previous revision number,
//    the progressive release status of a pending release of the same release
// ]
export function getProgressiveState(
  state: any,
  channel: string,
  arch: string,
  isPending: undefined,
) {
  if (!isProgressiveReleaseEnabled(state)) {
    return [null, null, null];
  }

  const { releases, pendingReleases, revisions } = state;

  let previousRevision = null;
  let pendingProgressiveStatus = null;

  const allReleases = releases.filter(
    (item: { architecture: string }) =>
      channel === getChannelString(item) && arch === item.architecture,
  );

  const release = allReleases[0];

  if (release && release.revision) {
    // If the release is pending we don't want to look up the previous state, as it will be
    // for an outdated release
    if (!isPending && release && release.isProgressive) {
      previousRevision = allReleases.find(
        (r: any) => r.revision !== release.revision,
      );

      if (previousRevision && previousRevision.revision) {
        previousRevision = revisions[previousRevision.revision];
      }
    }

    let pendingMatch: any;

    Object.keys(pendingReleases).forEach((revId) => {
      if (
        pendingReleases[revId][channel] &&
        pendingReleases[revId][channel].revision &&
        pendingReleases[revId][channel].revision.architectures.includes(arch)
      ) {
        pendingMatch = pendingReleases[revId][channel];
      }
    });

    if (pendingMatch) {
      if (
        channel === pendingMatch.channel &&
        pendingMatch.revision.architectures.includes(arch)
      ) {
        pendingProgressiveStatus = Object.assign({}, pendingMatch.progressive);
      }
    }
  }

  return [previousRevision, pendingProgressiveStatus];
}

// Is the latest release for a channel & architecture a valid revision?
export function hasRelease(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
  channel: string,
  architecture: string,
) {
  const { releases } = state;
  const filteredReleases = releases.filter(
    (release) =>
      release.architecture === architecture &&
      getChannelString(release) === channel,
  );

  return filteredReleases &&
    filteredReleases[0] &&
    filteredReleases[0].revision !== null
    ? true
    : false;
}

// Separate pendingRelease actions
export function getSeparatePendingReleases(
  state: CombinedState<{
    architectures: any[];
    availableRevisionsSelect: any;
    branches: any[];
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: { flags: {} };
    pendingCloses: any[];
    pendingReleases: any;
    revisions: any;
    releases: any[];
  }>,
) {
  const { pendingReleases } = state;
  const isProgressiveEnabled = isProgressiveReleaseEnabled(state);

  const progressiveUpdates: { [key: string]: any } = {};
  const newReleases: { [key: string]: any } = {};
  const newReleasesToProgress: { [key: string]: any } = {};
  const cancelProgressive: { [key: string]: any } = {};

  Object.keys(pendingReleases).forEach((revId) => {
    Object.keys(pendingReleases[revId]).forEach((channel) => {
      const pendingRelease = pendingReleases[revId][channel];
      const releaseCopy = jsonClone(pendingRelease);

      if (isProgressiveEnabled && pendingRelease.replaces) {
        const oldRelease = pendingRelease.replaces;
        cancelProgressive[`${oldRelease.revision.revision}-${channel}`] =
          oldRelease;
      } else if (
        isProgressiveEnabled &&
        pendingRelease.progressive &&
        pendingRelease.previousRevisions &&
        pendingRelease.previousRevisions.length > 0 &&
        pendingRelease.previousRevisions[0]
      ) {
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
            value: newState.paused,
          });
        }

        if (newState.percentage !== previousState.percentage) {
          changes.push({
            key: "percentage",
            value: newState.percentage,
          });
        }

        if (previousState.key) {
          // Add this to the copy of the pendingRelease state
          releaseCopy.progressive.changes = changes;
          progressiveUpdates[`${revId}-${channel}`] = releaseCopy;
        } else {
          newReleasesToProgress[`${revId}-${channel}`] = releaseCopy;
        }
      } else {
        newReleases[`${revId}-${channel}`] = releaseCopy;
      }
    });
  });

  return {
    progressiveUpdates,
    newReleases,
    newReleasesToProgress,
    cancelProgressive,
  };
}

// Get pending release for architecture
export function getPendingRelease(
  {
    pendingReleases,
  }: {
    pendingReleases: any;
    "__@$CombinedState@14396": any;
    architectures: any;
    availableRevisionsSelect: any;
    branches: any;
    channelMap: any;
    currentTrack: any;
    defaultTrack: any;
    history: any;
    modal: any;
    notification: any;
    options: any;
    pendingCloses: any;
    revisions: any;
    releases: any;
  },
  channel: string,
  arch: string,
) {
  // for each release
  return Object.keys(pendingReleases).map((releasedRevision) => {
    if (
      pendingReleases[releasedRevision][channel] &&
      pendingReleases[releasedRevision][
        channel
      ].revision.architectures.includes(arch)
    ) {
      return pendingReleases[releasedRevision][channel];
    }

    return null;
  })[0];
}

// Get releases
export function getReleases(
  {
    releases,
  }: { releases: never[] | { architecture: string; channel: string }[] },
  archs: string | any[],
  channel: string,
) {
  return releases.filter(
    (release: any) =>
      archs.includes(release.architecture) && release.channel === channel,
  );
}
