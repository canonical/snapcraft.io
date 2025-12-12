import {
  GenericReleasesAction,
  PendingReleaseItem,
  Progressive,
  Revision,
  ReleasesReduxState,
  DispatchFn,
  Release,
} from "../../../types/releaseTypes";

export const RELEASE_REVISION = "RELEASE_REVISION";
export const UNDO_RELEASE = "UNDO_RELEASE";
export const CANCEL_PENDING_RELEASES = "CANCEL_PENDING_RELEASES";
export const SET_PROGRESSIVE_RELEASE_PERCENTAGE =
  "SET_PROGRESSIVE_RELEASE_PERCENTAGE";
export const UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE =
  "UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE";
export const PAUSE_PROGRESSIVE_RELEASE = "PAUSE_PROGRESSIVE_RELEASE";
export const RESUME_PROGRESSIVE_RELEASE = "RESUME_PROGRESSIVE_RELEASE";
export const CANCEL_PROGRESSIVE_RELEASE = "CANCEL_PROGRESSIVE_RELEASE";

import { getPendingChannelMap, getReleases } from "../selectors";

import { triggerGAEvent } from "../actions/gaEventTracking";
import { CloseChannelAction } from "./pendingCloses";

export type ReleaseRevisionAction = GenericReleasesAction<
  typeof RELEASE_REVISION,
  {
    revision: Revision;
    channel: string;
    progressive?: PendingReleaseItem["progressive"];
    previousReleases?: PendingReleaseItem["previousReleases"];
  }
>;

export type UndoReleaseAction = GenericReleasesAction<
  typeof UNDO_RELEASE,
  {
    revision: Revision;
    channel: string;
  }
>;

export type CancelPendingReleasesAction = GenericReleasesAction<
  typeof CANCEL_PENDING_RELEASES,
  never
>;

export type SetProgressiveReleasePercentageAction = GenericReleasesAction<
  typeof SET_PROGRESSIVE_RELEASE_PERCENTAGE,
  Progressive
>;

export type UpdateProgressiveReleasePercentageAction = GenericReleasesAction<
  typeof UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
  Progressive
>;

export type PauseProgressiveReleaseAction = GenericReleasesAction<
  typeof PAUSE_PROGRESSIVE_RELEASE,
  never
>;

export type ResumeProgressiveReleaseAction = GenericReleasesAction<
  typeof RESUME_PROGRESSIVE_RELEASE,
  never
>;

export type CancelProgressiveReleaseAction = GenericReleasesAction<
  typeof CANCEL_PROGRESSIVE_RELEASE,
  {
    previousRevision: Revision;
  }
>;

export type PendingReleasesAction =
  | ReleaseRevisionAction
  | UndoReleaseAction
  | CancelPendingReleasesAction
  | SetProgressiveReleasePercentageAction
  | UpdateProgressiveReleasePercentageAction
  | PauseProgressiveReleaseAction
  | ResumeProgressiveReleaseAction
  | CancelProgressiveReleaseAction
  | CloseChannelAction;

export function releaseRevision(
  revision: Revision,
  channel: string,
  progressive?: PendingReleaseItem["progressive"]
) {
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const state = getState();
    const { revisions, pendingReleases } = state;

    const previousReleases = getReleases(state, revision.architectures, channel)
      // Find all revision releases for this channel and architecture
      // that do not share the same revision number as the previous release.
      // for example [1, 1, 2, 2, 3, 2, 2, 2, 1] will return [1, 2, 3, 2, 1]
      .reduce((acc: Release[], release: Release) => {
        if (!acc.length || acc[acc.length - 1].revision !== release.revision) {
          acc.push(release);
        }

        return acc;
      }, [])
      .map((release) => revisions[release.revision!]);

    let revisionToRelease = revision;

    if (!progressive && previousReleases.length > 0 && previousReleases[0]) {
      revisionToRelease = revisions[revision.revision];

      let percentage: number | null = 100;

      // If there's already a "null" release in staging that is progressive
      // assign that value to subsequent progressive releases
      Object.keys(pendingReleases).forEach((revision) => {
        Object.keys(pendingReleases[revision]).forEach((channel) => {
          const release = pendingReleases[revision][channel];

          if (release.progressive && percentage === 100) {
            percentage = release.progressive.percentage;
          }
        });
      });

      // Set key to null as we want to set the same key for a group
      // of releases on release. In actions/releases.js the key is either
      // updated, or the progressive object is removed completely
      progressive = {
        percentage: percentage,
        paused: false,
      } as Progressive;
    }

    return dispatch({
      type: RELEASE_REVISION,
      payload: {
        revision: revisionToRelease,
        channel,
        progressive,
        previousReleases,
      },
    });
  };
}

export function setProgressiveReleasePercentage(
  percentage: number
): SetProgressiveReleasePercentageAction {
  return {
    type: SET_PROGRESSIVE_RELEASE_PERCENTAGE,
    payload: {
      percentage,
    } as Progressive,
  };
}

export function updateProgressiveReleasePercentage(
  percentage: number
): UpdateProgressiveReleasePercentageAction {
  return {
    type: UPDATE_PROGRESSIVE_RELEASE_PERCENTAGE,
    payload: {
      percentage,
    } as Progressive,
  };
}

export function pauseProgressiveRelease(): PauseProgressiveReleaseAction {
  return {
    type: PAUSE_PROGRESSIVE_RELEASE,
  };
}

export function resumeProgressiveRelease(): ResumeProgressiveReleaseAction {
  return {
    type: RESUME_PROGRESSIVE_RELEASE,
  };
}

export function cancelProgressiveRelease(
  previousRevision: Revision
): CancelProgressiveReleaseAction {
  return {
    type: CANCEL_PROGRESSIVE_RELEASE,
    payload: {
      previousRevision,
    },
  };
}

export function promoteRevision(revision: Revision, channel: string) {
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const pendingChannelMap = getPendingChannelMap(getState());

    const canPromoteRevision = revision.architectures.every((arch) => {
      const releasedRevision = pendingChannelMap[channel]?.[arch];

      const isNotReleased = !releasedRevision;
      const isDifferentRevision =
        releasedRevision && releasedRevision.revision !== revision.revision;

      let releasedRevisionIsProgressive = false;
      if (releasedRevision) {
        const releasedRevisionReleaseHistory = releasedRevision.releases;

        if (releasedRevisionReleaseHistory) {
          const channelReleases = releasedRevisionReleaseHistory.filter(
            (r) => r.channel === channel && r.architecture === arch,
          );
          if (channelReleases.length > 0 && channelReleases[0].isProgressive) {
            releasedRevisionIsProgressive = true;
          }
        }
      }

      return (
        isNotReleased || isDifferentRevision || releasedRevisionIsProgressive
      );
    });

    if (canPromoteRevision) {
      dispatch(releaseRevision(revision, channel, undefined));
    }
  };
}

export function promoteChannel(channel: string, targetChannel: string) {
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const pendingChannelMap = getPendingChannelMap(getState());
    const pendingInChannel = pendingChannelMap[channel];

    if (pendingInChannel) {
      Object.values(pendingInChannel).forEach((revision) => {
        dispatch(promoteRevision(revision, targetChannel));
      });
    }
  };
}

export function undoRelease(revision: Revision, channel: string) {
  return (dispatch: DispatchFn) => {
    dispatch(
      triggerGAEvent(
        "click-cancel-promotion",
        `${channel}/${revision.architectures[0]}`,
      ),
    );
    return dispatch({
      type: UNDO_RELEASE,
      payload: { revision, channel },
    });
  };
}

export function cancelPendingReleases(): CancelPendingReleasesAction {
  return {
    type: CANCEL_PENDING_RELEASES,
  };
}
