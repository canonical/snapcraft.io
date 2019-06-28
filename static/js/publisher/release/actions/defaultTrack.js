import "whatwg-fetch";

export const SET_DEFAULT_TRACK_SUCCESS = "SET_DEFAULT_TRACK_SUCCESS";
export const SET_DEFAULT_TRACK_ERROR = "SET_DEFAULT_TRACK_ERROR";

export function setDefaultTrack(snapName, csrfToken, track) {
  const request = fetch(`/${snapName}/releases/default-track`, {
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

  return dispatch => {
    request
      .then(() => {
        dispatch({ type: SET_DEFAULT_TRACK_SUCCESS, payload: { track } });
      })
      .catch(() => {
        dispatch({
          type: SET_DEFAULT_TRACK_ERROR
        });
      });
  };
}
