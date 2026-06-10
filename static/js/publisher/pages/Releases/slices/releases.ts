import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  RISKS_WITH_AVAILABLE as RISKS,
  DEFAULT_ERROR_MESSAGE as ERROR_MESSAGE,
} from "../constants";
import { updateArchitectures } from "./architectures";
import { hideNotification, showNotification } from "./notification";
import { cancelPendingChanges } from "./pendingChanges";
import {
  releaseRevisionSuccess,
  closeChannelSuccess,
  initChannelMap,
} from "./channelMap";
import { updateRevisions } from "./revisions";
import { closeHistory } from "./history";
import { releasesReady } from "./options";
import {
  fetchSnapReleaseStatus,
  fetchRelease,
  fetchClose,
} from "../api/releases";
import {
  getReleaseDataFromChannelMap,
  getRevisionsMap,
  initReleasesData,
} from "../releasesState";
import { updateFailedRevisions } from "./failedRevisions";
import type {
  PendingReleaseItem,
  ReleasesAPIResponse,
  FetchReleaseResponse,
  FetchReleasePayload,
  CloseChannelsResponse,
  Revision,
  ReleaseErrorResponse,
  ReleasesState,
  RevisionsState,
  PendingChangesState,
  ProgressivePayload,
} from "../../../types/releaseTypes";
import type { AppAsyncThunkConfig, AppDispatch, RootState } from "../store";
import { getArrayOfChannelNames } from "../helpers";


const RELEASES_SLICE_NAME = "releases";

// returns a Redux async thunk callback that unpacks the API response into the state
export const updateReleasesUI = createAsyncThunk<
  void,
  ReleasesAPIResponse,
  AppAsyncThunkConfig
>(
  `${RELEASES_SLICE_NAME}/updateUI`,
  async (apiData, { dispatch }) => {
    const {
      release_history: releasesData,
      channel_map: channelMap,
      snap_name: snapName,
    } = apiData.data;
    const revisionsList = releasesData.revisions;
    const releases = releasesData.releases;

    try {
      const [transformedChannelMap, revisionsListAdditions, failedRevisions] =
        await getReleaseDataFromChannelMap(channelMap, revisionsList, snapName);
      revisionsList.push(...revisionsListAdditions);
      const revisionsMap = getRevisionsMap(revisionsList);
      initReleasesData(revisionsMap, releases, channelMap);
      dispatch(updateRevisions(revisionsMap));
      dispatch(updateReleases(releases));
      dispatch(updateArchitectures(revisionsList));
      dispatch(initChannelMap(transformedChannelMap));
      dispatch(updateFailedRevisions(failedRevisions));
      dispatch(releasesReady(true));
    } catch (error: unknown) {
      dispatch(
        showNotification({
          status: "error",
          appearance: "negative",
          content: ERROR_MESSAGE,
        })
      );
      throw error;
    }
  },
);

function handleCloseResponse(
  dispatch: AppDispatch,
  json: CloseChannelsResponse,
  channels: PendingChangesState["pendingCloses"]
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
    const channelNames = getArrayOfChannelNames(channels);
    const error = new Error(
      `Error while closing channels: ${channelNames.join(", ")}.`
    );
    // @ts-ignore
    error.json = json;
    throw error;
  }
}

function handleReleaseResponse(
  dispatch: AppDispatch,
  json: FetchReleaseResponse,
  release: FetchReleasePayload,
  revisions: RevisionsState
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
              dispatch(releaseRevisionSuccess({ revision, channel }));
            }
          });
        });
      });
    });
  } else {
    throw new Error((json as ReleaseErrorResponse).errors[0]);
  }
}

function mapToRelease(
  pendingRelease: PendingReleaseItem
): FetchReleasePayload {
  let progressive: ProgressivePayload | null = null;

  if (
    pendingRelease?.progressive?.percentage &&
    pendingRelease?.progressive?.percentage < 100
  ) {
    progressive = {
      percentage: pendingRelease.progressive.percentage,
      paused: false,
    };
  }

  return {
    id: pendingRelease.revision.revision,
    revision: pendingRelease.revision,
    channels: [pendingRelease.channel],
    progressive: progressive,
  };
};

// async thunk method to push all the pending changes to the Store backend
export const releaseRevisions = createAsyncThunk<
  void,
  void,
  AppAsyncThunkConfig
>(
  `${RELEASES_SLICE_NAME}/post`,
  async (_, { getState, dispatch }) => {
    const { pendingChanges, revisions, options } = getState();
    const { snapName } = options;
    const pendingCloses = pendingChanges.pendingCloses;
    dispatch(hideNotification());
    // TODO: we're doing a lot of sequential network requests
    // should we display a loading state in the UI ?

    try {
      // send the requests in order — later changes can overwrite earlier ones,
      // so each pending release must be sent individually without deduplication
      for (let index = 0; index < pendingChanges.changeOrderIndex; ++index) {
        const pendingClose = pendingCloses[index];
        if (pendingClose) {
          const json = await fetchClose(snapName, [pendingClose]);
          handleCloseResponse(dispatch, json, pendingCloses);
        } else {
          const pendingRelease = pendingChanges.pendingReleases[index];
          // some changes could have been removed by the user and the index
          // will be undefined
          if (!pendingRelease) {
            continue;
          }
          const release = mapToRelease(pendingRelease);
          const json = await fetchRelease(
            snapName,
            release.id,
            release.channels,
            release.progressive
          );
          handleReleaseResponse(dispatch, json, release, revisions);
        }
      }

      const jsonData = await fetchSnapReleaseStatus(snapName);
      dispatch(updateReleasesUI(jsonData));
      dispatch(cancelPendingChanges());
      dispatch(closeHistory());
    } catch (error: unknown) {
      dispatch(
        showNotification({
          status: "error",
          appearance: "negative",
          content: ERROR_MESSAGE,
        })
      );
    }
  },
);

const releasesSlice = createSlice({
  name: "options",
  initialState: [] as ReleasesState,
  reducers: {
    updateReleases(_state, action: PayloadAction<ReleasesState>) {
      return action.payload;
    },
  }
});

export const { updateReleases } = releasesSlice.actions;
export default releasesSlice.reducer;
