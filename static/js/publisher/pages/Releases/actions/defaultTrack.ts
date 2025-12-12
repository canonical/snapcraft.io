import { CLOSE_MODAL } from "./modal";
import { showNotification } from "./globalNotification";
import {
  GenericReleasesAction,
  ReleasesReduxState,
  DispatchFn,
} from "../../../types/releaseTypes";

export const SET_DEFAULT_TRACK_SUCCESS = "SET_DEFAULT_TRACK_SUCCESS";
export const SET_DEFAULT_TRACK_FAILURE = "SET_DEFAULT_TRACK_FAILURE";

export type SetDefaultTrackSuccessAction = GenericReleasesAction<
  typeof SET_DEFAULT_TRACK_SUCCESS,
  ReleasesReduxState["defaultTrack"]
>;

export type SetDefaultTrackFailureAction = GenericReleasesAction<
  typeof SET_DEFAULT_TRACK_FAILURE,
  never
>;

export type DefaultTrackAction =
  | SetDefaultTrackSuccessAction
  | SetDefaultTrackFailureAction;

const fetchDefaultTrack = (snapName: string, track: string | null) => {
  return fetch(`/${snapName}/releases/default-track`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-CSRFToken": (window as any).CSRF_TOKEN,
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
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
    const { options } = getState();
    const { snapName } = options;

    return fetchDefaultTrack(snapName, null).then(() => {
      dispatch({
        type: SET_DEFAULT_TRACK_SUCCESS,
        payload: null,
      });
      dispatch({
        type: CLOSE_MODAL,
      } as any);
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
  return (dispatch: DispatchFn, getState: () => ReleasesReduxState) => {
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
      .catch((errorResponse: Response) => {
        dispatch({
          type: SET_DEFAULT_TRACK_FAILURE,
        } as any);
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
        } as any);
      });
  };
}
