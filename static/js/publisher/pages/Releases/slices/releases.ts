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
  fetchReleases,
  fetchCloses,
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
} from "../../../types/releaseTypes";
import type { AppAsyncThunkConfig, AppDispatch, RootState } from "../store";
import { getArrayOfChannelNames } from "../helpers";


const RELEASES_SLICE_NAME = "releases";

// returns a Redux async thunk callback that unpacks the API response into the state
export const updateReleasesData = createAsyncThunk<
  void,
  ReleasesAPIResponse,
  AppAsyncThunkConfig
>(
  `${RELEASES_SLICE_NAME}/update`,
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
  let progressive = null;

  if (
    pendingRelease?.progressive?.percentage &&
    pendingRelease?.progressive?.percentage < 100
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

function dedupeReleases(
  pendingReleases: PendingChangesState["pendingReleases"]
): FetchReleasePayload[] {
  const progressiveReleases: FetchReleasePayload[] = [];
  const regularReleases: FetchReleasePayload[] = [];
  Object.keys(pendingReleases).forEach((orderIndex) => {
    const numericOrderIndex = Number(orderIndex);
    const revId = pendingReleases[numericOrderIndex].revision;
    const channels = pendingReleases[numericOrderIndex].channels;
    Object.keys(channels).forEach((channel) => {
      const pendingRelease = channels[channel];
      if (pendingRelease.progressive) {
        // first move progressive releases out
        progressiveReleases.push(mapToRelease(pendingRelease));
      } else {
        const releaseIndex = regularReleases.findIndex(
          (release) => release.revision.revision === revId
        );
        if (releaseIndex === -1) {
          regularReleases.push(mapToRelease(pendingRelease));
        } else {
          regularReleases[releaseIndex].channels.push(pendingRelease.channel);
        }
      }
    });
  });
  return [...progressiveReleases, ...regularReleases];
}

// async thunk method to push all the pending changes to the Store backend
export const releaseRevisions = createAsyncThunk<
  void,
  void,
  AppAsyncThunkConfig
>(
  `${RELEASES_SLICE_NAME}/update`,
  async (_, { getState, dispatch }) => {
    const { pendingChanges, revisions, options } = getState();
    const { snapName } = options;
    const pendingCloses = pendingChanges.pendingCloses;
    const releases = dedupeReleases(pendingChanges.pendingReleases);
    dispatch(hideNotification());

    try {
      await fetchReleases(
        (json, release) => handleReleaseResponse(dispatch, json, release, revisions),
        releases,
        snapName,
      );
      await fetchCloses(
        (json) => handleCloseResponse(dispatch, json, pendingCloses),
        snapName,
        getArrayOfChannelNames(pendingCloses),
      )
      const jsonData = await fetchSnapReleaseStatus(snapName);
      dispatch(updateReleasesData(jsonData));
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
