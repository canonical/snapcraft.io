import { isAfter, differenceInDays, parseISO } from "date-fns";
import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../constants";
import { isInDevmode, getBuildId, isRevisionBuiltOnLauchpad } from "../helpers";
import { sortAlphaNum, getChannelString } from "../../../../libs/channels";
import type {
  ArchitectureRevisionsMap,
  AvailableRevisionsSelect,
  CPUArchitecture,
  LaunchpadBuildRevision,
  PendingChangesState,
  PendingReleaseItem,
  Progressive,
  Release,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";

// returns true if isProgressiveReleaseEnabled feature flag is enabled
export function isProgressiveReleaseEnabled(state: ReleasesReduxState) {
  return !!state.options.flags.isProgressiveReleaseEnabled;
}

export type ReleaseHistoryItem = ReleasesReduxState["revisions"][string] & { release: Release };

// returns release history filtered by history filters
export function getFilteredReleaseHistory(state: ReleasesReduxState): ReleaseHistoryItem[] {
  const releases = state.releases;
  const revisions = state.revisions;
  const filters = state.history.filters;

  return (
    releases
      // only releases of revisions (ignore closing channels)
      .filter((release) => release.revision && revisions[release.revision])
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
          ...revisions[release.revision!],
          release,
        };
      })
  );
}

// returns list of selected revisions, to know which ones to render selected
export function getSelectedRevisions(state: ReleasesReduxState) {
  if (state.channelMap[AVAILABLE]) {
    return Object
      .values(state.channelMap[AVAILABLE])
      .map((revision) => revision?.revision)
      .filter((revision) => revision !== undefined);
  }

  return [];
}

// return selected revision for given architecture
export function getSelectedRevision(
  state: ReleasesReduxState,
  arch: CPUArchitecture
) {
  if (state.channelMap[AVAILABLE]) {
    return state.channelMap[AVAILABLE][arch];
  }
}

// returns list of selected architectures
export function getSelectedArchitectures(state: ReleasesReduxState) {
  if (state.channelMap[AVAILABLE]) {
    return Object.keys(state.channelMap[AVAILABLE]);
  }

  return [];
}

// return true if there are any devmode revisions in the state
export function hasDevmodeRevisions(state: ReleasesReduxState) {
  return Object.values(state.channelMap).some((archReleases) => {
    return Object
      .values(archReleases)
      .filter((revision) => revision !== undefined)
      .some(isInDevmode);
  });
}

// get channel map data updated with any pending releases and closes, applied in
// change-order so later changes override earlier ones per cell (channel/arch).
// A close clears the entire channel; a subsequent release re-populates only the
// architectures carried by that revision.
export function getPendingChannelMap(state: ReleasesReduxState) {
  const { channelMap, pendingChanges } = state;
  const pendingChannelMap = structuredClone(channelMap);
  const { pendingReleases, pendingCloses } = pendingChanges;

  type CloseChange = { orderIndex: number; type: "close"; channel: string };
  type ReleaseChange = { orderIndex: number; type: "release"; pendingRelease: PendingReleaseItem };

  const allChanges: Array<CloseChange | ReleaseChange> = [];

  Object.entries(pendingCloses).forEach(([orderIndex, channel]) => {
    allChanges.push({ orderIndex: parseInt(orderIndex), type: "close", channel });
  });

  Object.entries(pendingReleases).forEach(([orderIndex, pendingRelease]) => {
    allChanges.push({ orderIndex: parseInt(orderIndex), type: "release", pendingRelease });
  });

  allChanges.sort((a, b) => a.orderIndex - b.orderIndex).forEach((change) => {
    if (change.type === "close") {
      delete pendingChannelMap[change.channel];
    } else {
      const { revision, channel } = change.pendingRelease;
      if (!pendingChannelMap[channel]) {
        pendingChannelMap[channel] = {} as ArchitectureRevisionsMap;
      }
      revision.architectures.forEach((arch: CPUArchitecture) => {
        pendingChannelMap[channel]![arch] = revision;
      });
    }
  });

  return pendingChannelMap;
}

// Returns true when a specific channel/arch cell is effectively "pending close":
// the channel has a pending close with no later pending release for that arch.
export function isArchPendingClose(
  state: ReleasesReduxState,
  channel: string,
  arch: CPUArchitecture
): boolean {
  const { pendingReleases, pendingCloses } = state.pendingChanges;

  const closeOrders = Object.entries(pendingCloses)
    .filter(([_, ch]) => ch === channel)
    .map(([orderIndex]) => parseInt(orderIndex));

  if (closeOrders.length === 0) {
    return false;
  }

  const latestCloseOrder = Math.max(...closeOrders);

  return !Object.entries(pendingReleases).some(
    ([orderIndex, release]) =>
      parseInt(orderIndex) > latestCloseOrder &&
      release.channel === channel &&
      release.revision.architectures.includes(arch)
  );
}

// get all revisions ordered from newest (based on revsion id)
export function getAllRevisions(state: ReleasesReduxState) {
  return Object.values(state.revisions).reverse();
}

export function getRevisionById(state: ReleasesReduxState, id: number) {
  return getAllRevisions(state).find((rev) => rev.revision === id);
}

// get all revisions not released to any channel yet
export function getUnreleasedRevisions(state: ReleasesReduxState) {
  return getAllRevisions(state).filter(
    (revision) => !revision.channels || revision.channels.length === 0
  );
}

// get unreleased revisions not older then 7 days
export function getRecentRevisions(state: ReleasesReduxState) {
  const interval = 1000 * 60 * 60 * 24 * 7; // 7 days
  return getUnreleasedRevisions(state).filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < interval
  );
}

// return list of revisions based on given selection value
export function getAvailableRevisionsBySelection(
  state: ReleasesReduxState,
  value: AvailableRevisionsSelect
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
export function getFilteredAvailableRevisions(state: ReleasesReduxState) {
  const { availableRevisionsSelect } = state;
  return getAvailableRevisionsBySelection(state, availableRevisionsSelect);
}

// return list of revisions based on current availableRevisionsSelect value
// filtered by arch (can't be memoized)
export function getFilteredAvailableRevisionsForArch(
  state: ReleasesReduxState,
  arch: CPUArchitecture
) {
  return getFilteredAvailableRevisions(state).filter((revision) =>
    revision.architectures.includes(arch)
  );
}

// get list of architectures of uploaded revisions
export function getArchitectures(state: ReleasesReduxState) {
  return state.architectures && state.architectures.length > 0
    ? [...state.architectures]
    : [];
}

export function getTracks(state: ReleasesReduxState) {
  let tracks = state.options.tracks?.map((track) => track.name) ?? [];

  // @ts-ignore
  return sortAlphaNum([...new Set(tracks)], "latest");
}

export type Branch = Pick<
  Release,
  "track" | "risk" | "branch" | "when" | "revision"
> & {
  expiration: string;
};

export function getBranches(state: ReleasesReduxState) {
  const branches: Branch[] = [];
  const { currentTrack, releases } = state;

  const now = Date.now();

  releases
    .filter((t) => t.branch && t.track === currentTrack)
    .sort((a, b) => {
      return +isAfter(parseISO(b.when), parseISO(a.when));
    })
    .forEach((item) => {
      const { track, risk, branch, when, revision } = item;
      const exists =
        branches.filter(
          (b) => b.track === track && b.risk === risk && b.branch === branch
        ).length > 0;

      if (!exists) {
        branches.push({
          track,
          risk,
          branch,
          revision,
          when,
          expiration: item["expiration-date"]!,
        });
      }
    });

  return branches
    .filter((b) => {
      return differenceInDays(parseISO(b.expiration), now) > 0;
    })
    .reverse();
}

// return true if there is a pending release in given channel for given arch
export function hasPendingRelease(
  state: ReleasesReduxState,
  channel: string,
  arch: CPUArchitecture
) {
  const { channelMap } = state;
  const pendingChannelMap = getPendingChannelMap(state);

  // current revision to show (released or pending)
  const currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];
  // already released revision
  const releasedRevision = channelMap[channel] && channelMap[channel][arch];

  // check if there is a pending release in this cell
  return (
    currentRevision 
      ? (!releasedRevision ||
        releasedRevision.revision !== currentRevision.revision)
      : false
  );
}

export function getTrackRevisions(
  { channelMap }: ReleasesReduxState,
  track: string
) {
  const trackKeys = Object.keys(channelMap).filter(
    (trackName) => trackName.indexOf(track) == 0
  );
  return trackKeys.map((trackName) => channelMap[trackName]);
}

// return true if any revision has build-request-id attribute
export function hasBuildRequestId(state: ReleasesReduxState) {
  return getAllRevisions(state).some((revision) => getBuildId(revision));
}

// return revisions built by launchpad
export function getLaunchpadRevisions(state: ReleasesReduxState) {
  return getAllRevisions(state).filter(
    isRevisionBuiltOnLauchpad
  ) as LaunchpadBuildRevision[];
}

export function getRevisionsFromBuild(
  state: ReleasesReduxState,
  buildId: string
) {
  return getAllRevisions(state).filter(
    (revision) => getBuildId(revision) === buildId
  );
}

function filterPendingReleases(
  pendingReleases: PendingChangesState["pendingReleases"],
  channel: string,
  arch: CPUArchitecture,
  revisionId?: number,
): PendingReleaseItem[] {
  return Object.values(pendingReleases)
    .filter((pri) => pri.channel === channel)
    .filter((pri) => pri.revision.architectures.includes(arch))
    .filter((pri) => revisionId !== undefined 
      ? pri.revision.revision === revisionId
      : true); // if no revisionId was provided we don't do any filtering
}

type PreviousRevisionState = Partial<
  Pick<Revision, "attributes" | "confinement" | "releases" | "revision" | "version">
>;

export type ProgressiveState = [PreviousRevisionState | null, Progressive | null];

// return an array of 2 items:
// [
//    the previous revision number,
//    the progressive release status of a pending release of the same release
// ]
export function getProgressiveState(
  state: ReleasesReduxState,
  channel: string,
  arch: CPUArchitecture,
  isPending: boolean
): ProgressiveState {
  if (!isProgressiveReleaseEnabled(state)) {
    return [null, null];
  }

  const { releases, pendingChanges, revisions } = state;
  const { pendingReleases } = pendingChanges;

  let previousRevision: PreviousRevisionState | null = null;
  let pendingProgressiveStatus: Progressive | null = null;

  const allReleases = releases.filter(
    (item) => channel === getChannelString(item) && arch === item.architecture
  );

  const release = allReleases.length > 0 ? allReleases[0] : null;

  if (release && release.revision) {
    // If the release is pending we don't want to look up the previous state, as it will be
    // for an outdated release
    // If the release is progressive, we do.
    if (!isPending && release.isProgressive) {
      // Find the previous revision in the list of all releases
      // that is not the current release.
      previousRevision = allReleases.find(
        (r) => r.revision !== release.revision
      ) as PreviousRevisionState;

      if (previousRevision && previousRevision.revision) {
        previousRevision = revisions[previousRevision.revision];
      }
    } else if (isPending) {
      previousRevision = revisions[release.revision];
    }

    const filteredPendingReleases = filterPendingReleases(
      pendingReleases,
      channel,
      arch,
    );
    // there should be just one filtered pending release
    let pendingMatch = filterPendingReleases.length > 0
      ? filteredPendingReleases[0]
      : undefined;

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
  state: ReleasesReduxState,
  channel: string,
  architecture: string
) {
  const { releases } = state;
  const filteredReleases = releases.filter(
    (release) =>
      release.architecture === architecture &&
      getChannelString(release) === channel
  );

  return filteredReleases &&
    filteredReleases[0] &&
    filteredReleases[0].revision !== null
    ? true
    : false;
}

type PendingReleaseMap = { [key: string]: PendingReleaseItem };

export type SeparatePendingReleases = Record<
  | "newReleases"
  | "newReleasesToProgress"
  | "cancelProgressive",
  PendingReleaseMap
>;

// Separate pendingRelease actions
export function getSeparatePendingReleases(state: ReleasesReduxState): SeparatePendingReleases {
  const { pendingReleases } = state.pendingChanges;
  const isProgressiveEnabled = isProgressiveReleaseEnabled(state);

  const newReleases: PendingReleaseMap = {};
  const newReleasesToProgress: PendingReleaseMap = {};
  const cancelProgressive: PendingReleaseMap = {};

  Object.values(pendingReleases).forEach((pendingReleaseItem) => {
    const releaseCopy = structuredClone(pendingReleaseItem);
    const revId = pendingReleaseItem.revision.revision;
    const channel = pendingReleaseItem.channel;

    if (isProgressiveEnabled && pendingReleaseItem.replaces) {
      const oldRelease = pendingReleaseItem.replaces;
      cancelProgressive[`${oldRelease.revision.revision}-${channel}`] =
        oldRelease;
    } else if (
      isProgressiveEnabled &&
      pendingReleaseItem.progressive &&
      pendingReleaseItem.previousReleases &&
      pendingReleaseItem.previousReleases.length > 0 &&
      pendingReleaseItem.previousReleases[0]
    ) {
      newReleasesToProgress[`${revId}-${channel}`] = releaseCopy;
    } else {
      newReleases[`${revId}-${channel}`] = releaseCopy;
    }
  });

  return {
    newReleases,
    newReleasesToProgress,
    cancelProgressive,
  };
}

// Get pending release for architecture
export function getPendingRelease(
  { pendingChanges }: ReleasesReduxState,
  channel: string,
  arch: CPUArchitecture,
  revisionId?: number,
): PendingReleaseItem | null {
  const filteredPendingReleases = filterPendingReleases(
    pendingChanges.pendingReleases,
    channel,
    arch,
    revisionId,
  );
  // there should be only one pendingRelease at most always
  // because if there's another that goes to the same channel it should overwrite it
  return filteredPendingReleases.length > 0
    ? filteredPendingReleases[0]
    : null;
}

// Get releases
export function getReleases(
  { releases }: ReleasesReduxState,
  archs: string | CPUArchitecture[],
  channel: string
) {
  return releases.filter(
    (release) =>
      archs.includes(release.architecture) && release.channel === channel
  );
}
