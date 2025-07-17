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

export const UPDATE_RELEASES = "UPDATE_RELEASES";

interface FetchReleaseResponse {
  data: {
    release_history: {
      revisions: any[];
      releases: any[];
    };
    channel_map: any;
    snap_name: string;
  };
}

function updateReleasesData(apiData: FetchReleaseResponse) {
  const {
    release_history: releasesData,
    channel_map: channelMap,
    snap_name: snapName,
  } = apiData.data;
  return (
    dispatch: (arg0: {
      type: string;
      payload:
        | { releases: any }
        | { revisions: any }
        | { architectures: any[] }
        | { channelMap: any };
    }) => void,
  ) => {
    const revisionsList = releasesData.revisions;
    const releases = releasesData.releases;

    getReleaseDataFromChannelMap(channelMap, revisionsList, snapName).then(
      ([transformedChannelMap, revisionsListAdditions]) => {
        revisionsList.push(...revisionsListAdditions);
        const revisionsMap = getRevisionsMap(revisionsList);
        initReleasesData(revisionsMap, releases, channelMap);
        dispatch(updateRevisions(revisionsMap));
        dispatch(updateReleases(releases));
        dispatch(updateArchitectures(revisionsList));
        dispatch(initChannelMap(transformedChannelMap));
      },
    );
  };
}

export function handleCloseResponse(dispatch: any, json: any, channels: any) {
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
      `Error while closing channels: ${channels.join(", ")}.`,
    );
    // @ts-ignore
    error.json = json;
    throw error;
  }
}

export function getErrorMessage(error: {
  message?: any;
  json?: any;
  errors?: any;
}) {
  let message = error.message || ERROR_MESSAGE;

  if (error.errors && error.errors.length > 0) {
    message = error.errors[0].message;
  }

  // try to find error messages in response json
  // which may be an array or errors or object with errors propery
  if (error.json) {
    const errors = error.json.length ? error.json : error.json.errors;

    if (errors.length) {
      message = `${message} ${errors
        .map((e: { message: any }) => e.message)
        .filter((m: any) => m)
        .join(" ")}`;
    }
  }

  return message;
}

export function handleReleaseResponse(
  dispatch: any,
  json: any,
  release: any,
  revisions: any,
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
          arch.forEach(
            (map: { revision: number; version: any; channel: any }) => {
              if (map.revision) {
                let revision;

                if (map.revision === +release.id) {
                  // release.id is a string so turn it into a number for comparison
                  revision = release.revision;
                } else if (revisions[map.revision]) {
                  revision = revisions[map.revision];
                } else {
                  revision = {
                    revision: map.revision,
                    version: map.version,
                    architectures: release.revision.architectures,
                  };
                }

                const channel = `${trackKey}/${map.channel}`;
                dispatch(releaseRevisionSuccess(revision, channel));
              }
            },
          );
        });
      });
    });
  } else {
    if (json.errors) {
      throw new Error(json.errors[0]);
    }
  }
}

export function releaseRevisions() {
  const mapToRelease = (pendingRelease: {
    progressive: { percentage: number };
    revision: { revision: any };
    channel: any;
  }) => {
    let progressive = null;

    if (
      pendingRelease.progressive &&
      pendingRelease.progressive.percentage < 100
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

  return (
    dispatch: any,
    getState: () => {
      pendingReleases: any;
      pendingCloses: any;
      revisions: any;
      options: any;
    },
  ) => {
    const { pendingReleases, pendingCloses, revisions, options } = getState();
    const { snapName } = options;

    // To dedupe releases
    const progressiveReleases: {
      id: any;
      revision: { revision: any };
      channels: any[];
      progressive: { percentage: number } | null;
    }[] = [];
    const regularReleases: Array<any> = [];
    Object.keys(pendingReleases).forEach((revId) => {
      Object.keys(pendingReleases[revId]).forEach((channel) => {
        const pendingRelease = pendingReleases[revId][channel];

        if (pendingRelease.progressive) {
          // first move progressive releases out

          progressiveReleases.push(mapToRelease(pendingRelease));
        } else {
          const releaseIndex = regularReleases.findIndex(
            (release: { revision: { revision: number } }) =>
              release.revision.revision === parseInt(revId),
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
      json: { success: any; channel_map_tree: any; errors?: any },
      release: { id: number; revision: number; channels: string[] }[],
    ) => {
      return handleReleaseResponse(dispatch, json, release, revisions);
    };

    const _handleCloseResponse = (json: {
      success?: any;
      closed_channels?: any;
      error?: boolean | undefined;
      json?: string | undefined;
    }) => {
      return handleCloseResponse(dispatch, json, pendingCloses);
    };

    dispatch(hideNotification());
    return fetchReleases(_handleReleaseResponse, releases, snapName)
      .then(() => fetchCloses(_handleCloseResponse, snapName, pendingCloses))
      .then(() => fetchSnapReleaseStatus(snapName))
      .then((json) =>
        dispatch(updateReleasesData(json as unknown as FetchReleaseResponse)),
      )
      .catch((error) =>
        dispatch(
          showNotification({
            status: "error",
            appearance: "negative",
            content: getErrorMessage(error),
          }),
        ),
      )
      .then(() => dispatch(cancelPendingReleases()))
      .then(() => dispatch(closeHistory()));
  };
}

export function updateReleases(releases: { revision: number }[]) {
  return {
    type: UPDATE_RELEASES,
    payload: { releases },
  };
}
