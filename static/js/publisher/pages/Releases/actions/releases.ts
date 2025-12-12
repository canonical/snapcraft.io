import {
  RISKS_WITH_AVAILABLE as RISKS,
  DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE,
} from "../constants";

import { updateArchitectures } from "./architectures";
import { hideNotification, showNotification } from "./globalNotification";
import { cancelPendingReleases } from "./pendingReleases";
import {
  releaseRevisionSuccess,
  closeChannelSuccess,
  initChannelMap,
} from "./channelMap";
import { updateRevisions } from "./revisions";
import { closeHistory } from "./history";

import {
  fetchSnapReleaseStatus,
  fetchReleases,
  fetchCloses,
} from "../api/releases";

import {
  getReleaseDataFromChannelMap,
  getRevisionsMap,
  initReleasesData,
} from "../releasesState";
import { updateFailedRevisions } from "./failedRevisions";
import {
  PendingReleaseItem,
  Release,
  ReleasesAPIResponse,
  DispatchFn,
  ReleasesReduxState,
  FetchReleaseResponse,
  FetchReleasePayload,
  CloseChannelsResponse,
  Revision,
  ReleaseErrorResponse,
} from "../../../types/releaseTypes";

export const UPDATE_RELEASES = "UPDATE_RELEASES";

// returns a Redux thunk callback that unpacks the API response into the state
function updateReleasesData(apiData: ReleasesAPIResponse) {
  const {
    release_history: releasesData,
    channel_map: channelMap,
    snap_name: snapName,
  } = apiData.data;
  return (dispatch: DispatchFn) => {
    const revisionsList = releasesData.revisions;
    const releases = releasesData.releases;

    getReleaseDataFromChannelMap(channelMap, revisionsList, snapName).then(
      ([transformedChannelMap, revisionsListAdditions, failedRevisions]) => {
        revisionsList.push(...revisionsListAdditions);
        const revisionsMap = getRevisionsMap(revisionsList);
        initReleasesData(revisionsMap, releases, channelMap);
        dispatch(updateRevisions(revisionsMap));
        dispatch(updateReleases(releases));
        dispatch(updateArchitectures(revisionsList));
        dispatch(initChannelMap(transformedChannelMap));
        dispatch(updateFailedRevisions(failedRevisions));
      }
    );
  };
}

export function handleCloseResponse(
  dispatch: DispatchFn,
  json: CloseChannelsResponse,
  channels: ReleasesReduxState["pendingCloses"]
) {
  if (json.success) {
    if (json.closed_channels && json.closed_channels.length > 0) {
      json.closed_channels.forEach((channel: string) => {
        // make sure channels without track name get prefixed with 'latest'
        if (RISKS.indexOf(channel.split("/")[0]) !== -1) {
          // TODO: This should be the default track, not latest
          channel = `latest/${channel}`;
        }

        dispatch(closeChannelSuccess(channel));
      });
    }
  } else {
    const error = new Error(
      `Error while closing channels: ${channels.join(", ")}.`
    );
    // @ts-ignore
    error.json = json;
    throw error;
  }
}

export function handleReleaseResponse(
  dispatch: DispatchFn,
  json: FetchReleaseResponse,
  release: FetchReleasePayload,
  revisions: ReleasesReduxState["revisions"]
) {
  if (json.success) {
    // Update channel map based on the response
    // We need to use channel_map_tree to get branches
    Object.keys(json.channel_map_tree).forEach((trackKey) => {
      const track = json.channel_map_tree[trackKey];
      Object.keys(track).forEach((seriesKey) => {
        const series = track[seriesKey];
        Object.keys(series).forEach((archKey) => {
          const arch = series[archKey];
          arch.forEach((map) => {
            if (map.revision) {
              let revision: Revision;

              if (map.revision === +release.id) {
                // release.id is a string so turn it into a number for comparison
                revision = release.revision;
              } else if (revisions[map.revision]) {
                revision = revisions[map.revision];
              } else {
                // TODO: when can this happen? we're doing a pretty awful cast
                // because there are many things missing from this object...
                revision = {
                  revision: map.revision,
                  version: map.version,
                  architectures: release.revision.architectures,
                } as Revision;
              }

              const channel = `${trackKey}/${map.channel}`;
              dispatch(releaseRevisionSuccess(revision, channel));
            }
          });
        });
      });
    });
  } else {
    throw new Error((json as ReleaseErrorResponse).errors[0]);
  }
}

export function releaseRevisions() {
  const mapToRelease = (
    pendingRelease: PendingReleaseItem
  ): FetchReleasePayload => {
    let progressive = null;

    if (
      pendingRelease?.progressive?.percentage &&
      pendingRelease?.progressive?.percentage < 100
    ) {
      progressive = pendingRelease.progressive;
    }

    return {
      id: pendingRelease.revision.revision,
      revision: pendingRelease.revision,
      channels: [pendingRelease.channel],
      progressive: progressive,
    };
  };

  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const { pendingReleases, pendingCloses, revisions, options } = getState();
    const { snapName } = options;

    // To dedupe releases
    const progressiveReleases: FetchReleasePayload[] = [];
    const regularReleases: FetchReleasePayload[] = [];
    Object.keys(pendingReleases).forEach((revId) => {
      Object.keys(pendingReleases[revId]).forEach((channel) => {
        const pendingRelease = pendingReleases[revId][channel];

        if (pendingRelease.progressive) {
          // first move progressive releases out
          progressiveReleases.push(mapToRelease(pendingRelease));
        } else {
          const releaseIndex = regularReleases.findIndex(
            (release) => release.revision.revision === parseInt(revId)
          );
          if (releaseIndex === -1) {
            regularReleases.push(mapToRelease(pendingRelease));
          } else {
            regularReleases[releaseIndex].channels.push(pendingRelease.channel);
          }
        }
      });
    });

    const releases = progressiveReleases.concat(regularReleases);

    const _handleReleaseResponse = (
      json: FetchReleaseResponse,
      release: FetchReleasePayload
    ) => {
      return handleReleaseResponse(dispatch, json, release, revisions);
    };

    const _handleCloseResponse = (json: CloseChannelsResponse) => {
      return handleCloseResponse(dispatch, json, pendingCloses);
    };

    dispatch(hideNotification());

    return fetchReleases(_handleReleaseResponse, releases, snapName)
      .then(() => fetchCloses(_handleCloseResponse, snapName, pendingCloses))
      .then(() => fetchSnapReleaseStatus(snapName))
      .then((json) => dispatch(updateReleasesData(json)))
      .catch(() =>
        dispatch(
          showNotification({
            status: "error",
            appearance: "negative",
            content: ERROR_MESSAGE,
          })
        )
      )
      .then(() => dispatch(cancelPendingReleases()))
      .then(() => dispatch(closeHistory()));
  };
}

export function updateReleases(releases: Release[]) {
  return {
    type: UPDATE_RELEASES,
    payload: { releases },
  };
}
