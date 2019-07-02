import "whatwg-fetch";

import { CLOSE_MODAL } from "./modal";
import { showNotification } from "./globalNotification";

export const SET_DEFAULT_TRACK_SUCCESS = "SET_DEFAULT_TRACK_SUCCESS";

const fetchDefaultTrack = (snapName, csrfToken, track) => {
  return fetch(`/${snapName}/releases/default-track`, {
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
    body: JSON.stringify({ default_track: track })
  }).then(response => response.json());
};

export function clearDefaultTrack() {
  return (dispatch, getState) => {
    const { options } = getState();
    const { snapName, csrfToken } = options;

    return fetchDefaultTrack(snapName, csrfToken, null).then(() => {
      dispatch({
        type: SET_DEFAULT_TRACK_SUCCESS,
        payload: null
      });
      dispatch({
        type: CLOSE_MODAL
      });
      dispatch(
        showNotification({
          status: "success",
          appearance: "positive",
          content: `The default track for ${snapName} has been removed. All new installations without a specified track (e.g. \`sudo snap install ${snapName}\`) will receive updates from latest track.`,
          canDismiss: true
        })
      );
    });
  };
}

export function setDefaultTrack() {
  return (dispatch, getState) => {
    const { options, currentTrack, defaultTrack } = getState();
    const { snapName, csrfToken } = options;

    let previousTrack = defaultTrack;
    if (!previousTrack) {
      previousTrack = "latest";
    }

    return fetchDefaultTrack(snapName, csrfToken, currentTrack).then(() => {
      dispatch({
        type: SET_DEFAULT_TRACK_SUCCESS,
        payload: currentTrack
      });
      dispatch({
        type: CLOSE_MODAL
      });
      dispatch(
        showNotification({
          status: "success",
          appearance: "positive",
          content: `The default track for ${snapName} has been set to ${currentTrack}. All new installations without a specified track (e.g. \`sudo snap install ${snapName}\`) will receive updates from the newly defined default track ${currentTrack}. Clients already tracking \`${previousTrack}\` will now be tracking ${currentTrack} on next refresh.`,
          canDismiss: true
        })
      );
    });
  };
}
