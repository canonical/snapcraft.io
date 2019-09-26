import "whatwg-fetch";

export const UPDATE_RELEASES = "UPDATE_RELEASES";

import { RISKS_WITH_AVAILABLE as RISKS } from "../constants";

import { hideNotification, showNotification } from "./globalNotification";
import { cancelPendingReleases } from "./pendingReleases";
import { releaseRevisionSuccess, closeChannelSuccess } from "./channelMap";
import { updateRevisions } from "./revisions";

import { getRevisionsMap, initReleasesData } from "../releasesState";

const ERROR_MESSAGE =
  "There was an error while processing your request, please try again later.";

function updateReleasesData(dispatch, releasesData) {
  // init channel data in revisions list
  const revisionsMap = getRevisionsMap(releasesData.revisions);
  initReleasesData(revisionsMap, releasesData.releases);

  dispatch(updateRevisions(revisionsMap));
  dispatch(updateReleases(releasesData.releases));
}

function fetchReleasesHistory(csrfToken, snapName) {
  return fetch(`/${snapName}/releases/json`, {
    method: "GET",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken
    },
    redirect: "follow",
    referrer: "no-referrer"
  })
    .then(response => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}

function fetchUpdatedReleasesHistory(dispatch, csrfToken, snapName) {
  return fetchReleasesHistory(csrfToken, snapName).then(json =>
    updateReleasesData(dispatch, json)
  );
}

function fetchRelease(csrfToken, snapName, revision, channels) {
  return fetch(`/${snapName}/releases`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify({ revision, channels, name: snapName })
  })
    .then(response => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}

function fetchClose(csrfToken, snapName, channels) {
  return fetch(`/${snapName}/releases/close-channel`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": csrfToken
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify({ channels })
  })
    .then(response => response.json())
    .catch(() => {
      throw new Error(ERROR_MESSAGE);
    });
}

function handleCloseResponse(json, channels) {
  if (json.success) {
    if (json.closed_channels && json.closed_channels.length > 0) {
      json.closed_channels.forEach(channel => {
        // make sure channels without track name get prefixed with 'latest'
        if (RISKS.indexOf(channel.split("/")[0]) !== -1) {
          // TODO: This should be the default track, not latest
          channel = `latest/${channel}`;
        }

        closeChannelSuccess(channel);
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

function fetchCloses(csrfToken, snapName, channels) {
  if (channels.length) {
    return fetchClose(channels).then(json => {
      handleCloseResponse(json, channels);
    });
  } else {
    return Promise.resolve();
  }
}

function handleReleaseError(error) {
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

  showNotification({
    status: "error",
    appearance: "negative",
    content: message
  });
}

// TODO: move inside of this function out
function handleReleaseResponse(dispatch, json, release, revisions) {
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
                // TODO: this should be the default track, not "latest"
                channel = `latest/${channel}`;
              }

              dispatch(releaseRevisionSuccess(revision, channel));
            }
          });
        });
      });
    });
  }
}

function fetchReleases(dispatch, csrfToken, snapName, releases, revisions) {
  let queue = Promise.resolve(); // Q() in q

  // handle releases as a queue
  releases.forEach(release => {
    return (queue = queue.then(() => {
      return fetchRelease(
        csrfToken,
        snapName,
        release.id,
        release.channels
      ).then(json => handleReleaseResponse(dispatch, json, release, revisions));
    }));
  });

  return queue;
}

export function releaseRevisions() {
  return (dispatch, getState) => {
    const { pendingReleases, pendingCloses, revisions, options } = getState();
    const { csrfToken, snapName } = options;
    const releases = Object.keys(pendingReleases).map(id => {
      return {
        id,
        revision: pendingReleases[id].revision,
        channels: pendingReleases[id].channels
      };
    });

    hideNotification();
    return fetchReleases(dispatch, csrfToken, snapName, releases, revisions)
      .then(() => fetchCloses(csrfToken, snapName, pendingCloses))
      .then(() => fetchUpdatedReleasesHistory(dispatch, csrfToken, snapName))
      .catch(error => handleReleaseError(error))
      .then(() => dispatch(cancelPendingReleases()));
  };
}

export function updateReleases(releases) {
  return {
    type: UPDATE_RELEASES,
    payload: { releases }
  };
}
