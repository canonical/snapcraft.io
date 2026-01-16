import { isAfter, differenceInDays, parseISO } from "date-fns";
import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
} from "../constants";
import { isInDevmode, getBuildId, isRevisionBuiltOnLauchpad } from "../helpers";
import { sortAlphaNum, getChannelString } from "../../../../libs/channels";
import {
  ArchitectureRevisionsMap,
  AvailableRevisionsSelect,
  CPUArchitecture,
  LaunchpadBuildRevision,
  PendingReleaseItem,
  Progressive,
  ProgressiveChanges,
  ProgressiveMutated,
  Release,
  ReleasesReduxState,
  Revision,
} from "../../../types/releaseTypes";

// returns true if isProgressiveReleaseEnabled feature flag is enabled
export function isProgressiveReleaseEnabled(state: ReleasesReduxState) {
  return !!state.options.flags.isProgressiveReleaseEnabled;
}

// returns release history filtered by history filters
export function getFilteredReleaseHistory(state: ReleasesReduxState) {
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
          ...revisions[release.revision!],
          release,
        };
      })
  );
}

// returns list of selected revisions, to know which ones to render selected
export function getSelectedRevisions(state: ReleasesReduxState) {
  if (state.channelMap[AVAILABLE]) {
    return Object.values(state.channelMap[AVAILABLE]).map(
      (revision) => revision.revision
    );
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
    return Object.values(archReleases).some(isInDevmode);
  });
}

// get channel map data updated with any pending releases
export function getPendingChannelMap(state: ReleasesReduxState) {
  const { channelMap, pendingReleases } = state;
  const pendingChannelMap = structuredClone(channelMap);

  // for each release
  Object.keys(pendingReleases).forEach((releasedRevision) => {
    Object.keys(pendingReleases[releasedRevision]).forEach((channel) => {
      const revision = pendingReleases[releasedRevision][channel].revision;

      if (!pendingChannelMap[channel]) {
        pendingChannelMap[channel] = {} as ArchitectureRevisionsMap;
      }

      revision.architectures.forEach((arch: CPUArchitecture) => {
        pendingChannelMap[channel]![arch] = revision;
      });
    });
  });

  return pendingChannelMap;
}

// get all revisions ordered from newest (based on revsion id)
export function getAllRevisions(state: ReleasesReduxState) {
  return Object.values(state.revisions).reverse();
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
    ? state.architectures.sort()
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
    currentRevision &&
    (!releasedRevision ||
      releasedRevision.revision !== currentRevision.revision)
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
    return [null, null]; // TODO: "return an array of 2 items", so why are we returning 3 nulls then?
  }

  const { releases, pendingReleases, revisions } = state;

  let previousRevision: PreviousRevisionState | null = null;
  let pendingProgressiveStatus: Progressive | null = null;

  const allReleases = releases.filter(
    (item) => channel === getChannelString(item) && arch === item.architecture
  );

  const release = allReleases[0];

  if (release && release.revision) {
    // If the release is pending we don't want to look up the previous state, as it will be
    // for an outdated release
    // If the release is progressive, we do.
    if (!isPending && release?.isProgressive) {
      // Find the previous revision in the list of all releases
      // that is not the current release.
      previousRevision = allReleases.find(
        (r) => r.revision !== release.revision
      ) as PreviousRevisionState;

      if (previousRevision && previousRevision.revision) {
        previousRevision = revisions[previousRevision.revision];
      }
    } else if (isPending) {
      previousRevision = revisions[allReleases[0]?.revision!];
    }

    let pendingMatch: PendingReleaseItem | undefined;

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

// Separate pendingRelease actions
export function getSeparatePendingReleases(state: ReleasesReduxState) {
  const { pendingReleases } = state;
  const isProgressiveEnabled = isProgressiveReleaseEnabled(state);

  const progressiveUpdates: { [key: string]: PendingReleaseItem } = {};
  const newReleases: { [key: string]: PendingReleaseItem } = {};
  const newReleasesToProgress: { [key: string]: PendingReleaseItem } = {};
  const cancelProgressive: { [key: string]: PendingReleaseItem["replaces"] } =
    {};

  Object.keys(pendingReleases).forEach((revId) => {
    Object.keys(pendingReleases[revId]).forEach((channel) => {
      const pendingRelease = pendingReleases[revId][channel];
      const releaseCopy = structuredClone(pendingRelease);

      if (isProgressiveEnabled && pendingRelease.replaces) {
        const oldRelease = pendingRelease.replaces;
        cancelProgressive[`${oldRelease.revision.revision}-${channel}`] =
          oldRelease;
      } else if (
        isProgressiveEnabled &&
        pendingRelease.progressive &&
        pendingRelease.previousReleases &&
        pendingRelease.previousReleases.length > 0 &&
        pendingRelease.previousReleases[0]
      ) {
        // What are the differences between the previous progressive state
        // and the new state.
        const previousState = releaseCopy.revision.release
          ? releaseCopy.revision.release.progressive
          : ({} as ProgressiveMutated);
        const newState = releaseCopy.progressive;

        const changes = [] as ProgressiveChanges;
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
  { pendingReleases }: ReleasesReduxState,
  channel: string,
  arch: CPUArchitecture
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
  { releases }: ReleasesReduxState,
  archs: string | CPUArchitecture[],
  channel: string
) {
  return releases.filter(
    (release) =>
      archs.includes(release.architecture) && release.channel === channel
  );
}
