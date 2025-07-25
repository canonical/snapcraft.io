import "whatwg-fetch";

import { CLOSE_MODAL } from "./modal";
import { showNotification } from "./globalNotification";

export const SET_DEFAULT_TRACK_SUCCESS = "SET_DEFAULT_TRACK_SUCCESS";
export const SET_DEFAULT_TRACK_FAILURE = "SET_DEFAULT_TRACK_FAILURE";

const fetchDefaultTrack = (snapName, track) => {
  return fetch(`/${snapName}/releases/default-track`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": window.CSRF_TOKEN,
    },
    redirect: "follow",
    referrer: "no-referrer",
    body: JSON.stringify({ default_track: track }),
  }).then((response) => {
    if (!response.ok) {
      return Promise.reject(response);
    }
    return response.json();
  });
};

export function clearDefaultTrack() {
  return (dispatch, getState) => {
    const { options } = getState();
    const { snapName } = options;

    return fetchDefaultTrack(snapName, null).then(() => {
      dispatch({
        type: SET_DEFAULT_TRACK_SUCCESS,
        payload: null,
      });
      dispatch({
        type: CLOSE_MODAL,
      });
      dispatch(
        showNotification({
          status: "success",
          appearance: "positive",
          content: `The default track for ${snapName} has been removed. All new installations without a specified track (e.g. \`sudo snap install ${snapName}\`) will receive updates from latest track.`,
          canDismiss: true,
        }),
      );
    });
  };
}

export function setDefaultTrack() {
  return (dispatch, getState) => {
    const { options, currentTrack } = getState();
    const { snapName } = options;

    return fetchDefaultTrack(snapName, currentTrack)
      .then(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_SUCCESS,
          payload: currentTrack,
        });
        dispatch(
          showNotification({
            status: "success",
            appearance: "positive",
            content: `The default track for ${snapName} has been set to ${currentTrack}. All new installations without a specified track (e.g. \`sudo snap install ${snapName}\`) will receive updates from the newly defined default track.`,
            canDismiss: true,
          }),
        );
      })
      .catch((errorResponse) => {
        dispatch({
          type: SET_DEFAULT_TRACK_FAILURE,
        });
        dispatch(
          showNotification({
            status: "error",
            appearance: "negative",
            content: `Failed to set the default track for ${snapName}. (${errorResponse.status}: ${errorResponse.statusText})`,
            canDismiss: true,
          }),
        );
      })
      .finally(() => {
        dispatch({
          type: CLOSE_MODAL,
        });
      });
  };
}
