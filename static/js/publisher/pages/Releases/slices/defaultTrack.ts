import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { closeModal } from "./modal";
import { showNotification } from "./notification";
import type { DefaultTrackState } from "../../../types/releaseTypes";
import type { AppAsyncThunkConfig } from "../store";

const DEFAULT_TRACK_NAME = "defaultTrack"

const fetchDefaultTrack = async (snapName: string, track: string | null) => {
  const response = await fetch(`/${snapName}/releases/default-track`, {
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
  });

  if (!response.ok) {
    throw response;
  }
  return response.json();
};

/**
 * The createAsyncThunk is composed in the following way:
 * 1. return type of the thunk on fulfilled case
 * 2. argument passed to the thunk (void => no argument)
 * 3. object to define redux properties types
 */

export const clearDefaultTrack = createAsyncThunk<
  void,
  void,
  AppAsyncThunkConfig
>(
  `${DEFAULT_TRACK_NAME}/clear`,
  async (_, { getState, dispatch }) => {
    const { options } = getState();
    const { snapName } = options;

    try {
      await fetchDefaultTrack(snapName, null);
      dispatch(showNotification({
        status: "success",
        appearance: "positive",
        content: `The default track for ${snapName} has been removed. `
          + `All new installations without a specified track `
          + `(e.g. \`sudo snap install ${snapName}\`) will receive updates from latest track.`,
        canDismiss: true,
      }));
    } catch (error: unknown) {
      if (error instanceof Response) {
        dispatch(showNotification({
          status: "error",
          appearance: "negative",
          content: `Failed to remove the default track for ${snapName}. `
            + `(${error.status}: ${error.statusText})`,
          canDismiss: true,
        }));
      }
      throw error;
    } finally {
      dispatch(closeModal());
    }
  },
);

export const setDefaultTrack = createAsyncThunk<
  string,
  void,
  AppAsyncThunkConfig
>(
  `${DEFAULT_TRACK_NAME}/set`,
  async (_, { getState, dispatch }) => {
    const { options, currentTrack } = getState();
    const { snapName } = options;

    try {
      await fetchDefaultTrack(snapName, currentTrack);
      dispatch(showNotification({
        status: "success",
        appearance: "positive",
        content: `The default track for ${snapName} has been set to ${currentTrack}. `
          + `All new installations without a specified track `
          + `(e.g. \`sudo snap install ${snapName}\`) will receive updates `
          + `from the newly defined default track.`,
        canDismiss: true,
      }));
      return currentTrack;
    } catch (error: unknown) {
      if (error instanceof Response) {
        dispatch(showNotification({
          status: "error",
          appearance: "negative",
          content: `Failed to set the default track for ${snapName}. `
            + `(${error.status}: ${error.statusText})`,
          canDismiss: true,
        }));
      }
      throw error;
    } finally {
      dispatch(closeModal());
    }
  },
);

const defaultTrackSlice = createSlice({
  name: DEFAULT_TRACK_NAME,
  initialState: "latest" as DefaultTrackState,
  reducers: {
    initDefaultTrack(_state, action: PayloadAction<DefaultTrackState>) {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setDefaultTrack.fulfilled, (_state, action) => {
        return action.payload;
      })
      .addCase(clearDefaultTrack.fulfilled, () => {
        return null;
      });
  },
});

export const { initDefaultTrack } = defaultTrackSlice.actions;
export default defaultTrackSlice.reducer;
