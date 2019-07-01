import "whatwg-fetch";

export const SET_DEFAULT_TRACK_SUCCESS = "SET_DEFAULT_TRACK_SUCCESS";
export const SET_DEFAULT_TRACK_ERROR = "SET_DEFAULT_TRACK_ERROR";

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

    fetchDefaultTrack(snapName, csrfToken, null)
      .then(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_SUCCESS,
          payload: { track: null }
        });
      })
      .catch(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_ERROR
        });
      });
  };
}

export function setDefaultTrack() {
  return (dispatch, getState) => {
    const { options, currentTrack } = getState();
    const { snapName, csrfToken } = options;

    fetchDefaultTrack(snapName, csrfToken, currentTrack)
      .then(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_SUCCESS,
          payload: { track: currentTrack }
        });
      })
      .catch(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_ERROR
        });
      });
  };
}
