import {
  RISKS_WITH_AVAILABLE as RISKS,
  DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE
} from "../constants";

import { hideNotification, showNotification } from "./globalNotification";
import { cancelPendingReleases } from "./pendingReleases";
import { releaseRevisionSuccess, closeChannelSuccess } from "./channelMap";
import { updateRevisions } from "./revisions";

import {
  fetchReleasesHistory,
  fetchReleases,
  fetchCloses
} from "../api/releases";

import { getRevisionsMap, initReleasesData } from "../releasesState";

export const UPDATE_RELEASES = "UPDATE_RELEASES";

function updateReleasesData(releasesData) {
  return dispatch => {
    // init channel data in revisions list
    const revisionsMap = getRevisionsMap(releasesData.revisions);
    initReleasesData(revisionsMap, releasesData.releases);
    dispatch(updateRevisions(revisionsMap));
    dispatch(updateReleases(releasesData.releases));
  };
}

export function handleCloseResponse(dispatch, json, channels) {
  if (json.success) {
    if (json.closed_channels && json.closed_channels.length > 0) {
      json.closed_channels.forEach(channel => {
        // make sure channels without track name get prefixed with 'latest'
        if (RISKS.indexOf(channel.split("/")[0]) !== -1) {
          // TODO: This should be the default track, not latest
          channel = `latest/${channel}`;
        }

        dispatch(closeChannelSuccess(channel));
      });
    }
  } else {
    let error = new Error(
      `Error while closing channels: ${channels.join(", ")}.`
    );
    error.json = json;
    throw error;
  }
}

export function getErrorMessage(error) {
  let message = error.message || ERROR_MESSAGE;

  // try to find error messages in response json
  // which may be an array or errors or object with errors propery
  if (error.json) {
    const errors = error.json.length ? error.json : error.json.errors;

    if (errors.length) {
      message = `${message} ${errors
        .map(e => e.message)
        .filter(m => m)
        .join(" ")}`;
    }
  }

  return message;
}

export function handleReleaseResponse(
  dispatch,
  json,
  release,
  revisions,
  defaultTrack
) {
  if (json.success) {
    // Update channel map based on the response
    // We need to use channel_map_tree to get branches
    Object.keys(json.channel_map_tree).forEach(trackKey => {
      const track = json.channel_map_tree[trackKey];
      Object.keys(track).forEach(seriesKey => {
        const series = track[seriesKey];
        Object.keys(series).forEach(archKey => {
          const arch = series[archKey];
          arch.forEach(map => {
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
                  architectures: release.revision.architectures
                };
              }

              let channel = map.channel;
              if (RISKS.indexOf(channel.split("/")[0]) > -1) {
                channel = `${defaultTrack}/${channel}`;
              }

              dispatch(releaseRevisionSuccess(revision, channel));
            }
          });
        });
      });
    });
  }
}

export function releaseRevisions() {
  return (dispatch, getState) => {
    const { pendingReleases, pendingCloses, revisions, options } = getState();
    const { csrfToken, snapName, defaultTrack } = options;
    const releases = Object.keys(pendingReleases).map(id => {
      return {
        id,
        revision: pendingReleases[id].revision,
        channels: pendingReleases[id].channels
      };
    });

    const _handleReleaseResponse = (json, release) => {
      return handleReleaseResponse(
        dispatch,
        json,
        release,
        revisions,
        defaultTrack
      );
    };

    const _handleCloseResponse = json => {
      return handleCloseResponse(dispatch, json, pendingCloses);
    };

    dispatch(hideNotification());
    return fetchReleases(_handleReleaseResponse, releases, csrfToken, snapName)
      .then(() =>
        fetchCloses(_handleCloseResponse, csrfToken, snapName, pendingCloses)
      )
      .then(() => fetchReleasesHistory(csrfToken, snapName))
      .then(json => dispatch(updateReleasesData(json)))
      .catch(error =>
        dispatch(
          showNotification({
            status: "error",
            appearance: "negative",
            content: getErrorMessage(error)
          })
        )
      )
      .then(() => dispatch(cancelPendingReleases()));
  };
}

export function updateReleases(releases) {
  return {
    type: UPDATE_RELEASES,
    payload: { releases }
  };
}
