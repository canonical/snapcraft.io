import { CombinedState } from "redux";
import { ThunkDispatch } from "redux-thunk";

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type NonEmptyArray<T> = [T, ...T[]];

type ISO8601Timestamp = string;

// TODO: these come from "../pages/Releases/constants", what should we do with them?
export type AvailableRevisionsSelect =
  | "AVAILABLE_REVISIONS_SELECT_LAUNCHPAD"
  | "AVAILABLE_REVISIONS_SELECT_UNRELEASED"
  | "AVAILABLE_REVISIONS_SELECT_RECENT"
  | "AVAILABLE_REVISIONS_SELECT_ALL";

/**
 * Distinct type for strings for supported architectures
 *
 * List based on the Snapcraft docs:
 * https://documentation.ubuntu.com/snapcraft/stable/reference/architectures/#supported-architectures
 */
export type CPUArchitecture =
  | "amd64"
  | "arm64"
  | "armhf"
  | "i386"
  | "powerpc"
  | "ppc64el"
  | "riscv64"
  | "s390x"
  | (string & {}); // use string as a fallback, otherwise the type is too strict and stuff like Object.keys breaks

export type Series = "16" | (string & {}); // series is and will always be 16, but again, we must use string as a fallback

export type Progressive = {
  "current-percentage": number | null;
  paused: boolean | null;
  percentage: number | null;
};

export type Release = {
  architecture: CPUArchitecture;
  branch: string | null;
  channel?: string; // in the form "<track>/<risk>"
  "expiration-date": ISO8601Timestamp | null;
  progressive: Progressive;
  revision: number | null;
  risk: string;
  track: string;
  when: ISO8601Timestamp;

  /**
   * The following property doesn't come from the Store backend, but rather is added by our JS for convenience;
   * its value is equivalent to `!!this.progressive.percentage`.
   * (see static/js/publisher/pages/Releases/releasesState.ts for more info)
   * Rather than having two separate Release types and keeping track of both of them, casting from one to the other,
   * etc., we just add this optional property here and pretend it actually is part of the Store backend response.
   */
  isProgressive?: boolean;
};

export type RevisionStatus =
  | "Published"
  | "Unpublished"
  | "ManualReviewPending"
  | "NeedsInformation"
  | "AutomaticallyRejected"
  | "Rejected";

export type SnapConfinement = "strict" | "classic" | "devmode";

export type RevisionGrade = "stable" | "devel";

export type Revision = {
  architectures: NonEmptyArray<CPUArchitecture>;
  attributes: {
    "build-request-id"?: string; // available if it's a Launchpad build
    "build-request-timestamp"?: ISO8601Timestamp; // available if it's a Launchpad build

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // store docs declare `attributes` as a generic "object" type
  };
  base: string; // "coreXX"
  build_url: string | null; // available if it's a Launchpad build
  confinement: SnapConfinement;
  created_at: ISO8601Timestamp;
  epoch: {
    read: NonEmptyArray<number>;
    write: NonEmptyArray<number>;
  };
  grade: RevisionGrade;
  revision: number;
  "sha3-384": string;
  size: number;
  status: RevisionStatus;
  version: string;

  /**
   * The following properties don't come from the Store backend, but rather are added by our JS for convenience.
   * (again, see static/js/publisher/pages/Releases/releasesState.ts for more info)
   * Again, we just pretend this is part of the actual store response and mark them as optional for "safety".
   */
  channels?: string[];
  releases?: Release[];
  progressive?: ChannelMap["progressive"];
  expiration?: ChannelMap["expiration-date"];
};

export type RevisionsMap = { [revision: number]: Revision };

export type Channel = {
  branch: string | null;
  fallback: string | null;
  name: string; // "<track>/<risk>"
  risk: string;
  track: string;
};

export type Track = {
  "creation-date": ISO8601Timestamp | null;
  name: string;
  status: string;
  "version-pattern": string | null;
  // Store API docs might be wrong because they mark `pattern` as required, but it doesn't exist
  // We assume that "version-pattern" is required, but it can still be null
};

export type Snap = {
  channels: NonEmptyArray<Channel>;
  "default-track": string | null;
  id: string;
  name: string;
  private: boolean;
  publisher?: {
    "display-name"?: string;
    id?: string;
    username?: string;
  };
  title?: string;
  tracks: NonEmptyArray<Track>;
};

export type Links = {
  self: string;
  first?: string;
  last?: string;
  next?: string;
  prev?: string;
};

/**
 * Types for response to Store API GET "/api/v2/snaps/(?P<name>[\\w-]+)/releases"
 *
 * All referenced types are based on the JSON schema provided in the docs:
 * https://dashboard.snapcraft.io/docs/reference/v2/en/snaps.html#response-json-schema
 */
export type ReleasesData = {
  _links: Links;
  releases: Release[];
  revisions: Revision[];
  snap: Snap;
};

/**
 * Types for response to Store API GET "/api/v2/snaps/(?P<name>[\\w-]+)/channel-map"
 * We only use the "channel-map" member of the response object, so we ignore "revisions" and "snap"
 *
 * All referenced types are based on the JSON schema provided in the docs:
 * https://dashboard.snapcraft.io/docs/reference/v2/en/snaps.html#id3
 */
export type ChannelMap = {
  architecture: CPUArchitecture;
  channel: Channel["name"];
  "expiration-date": ISO8601Timestamp | null;
  progressive: Progressive;
  revision: Revision["revision"] | null;
  when: ISO8601Timestamp;
};

/**
 * Types for response to our API GET "/api/<snap_name>/releases"
 * As implemented in `webapp.endpoints.releases.get_release_history_data`
 */
export type ReleasesAPIResponse = Prettify<{
  data: {
    channel_map: ChannelMap[];
    default_track: NonNullable<Snap["default-track"]>;
    private: Snap["private"];
    publisher_name: string;
    release_history: ReleasesData;
    snap_name: Snap["name"];
    snap_title: Snap["title"];
    tracks: Snap["tracks"];
  };
  success: boolean;
}>;

/**
 * Types for response to Store API GET "/dev/api/snap-release"
 * All types are based on the examples and explanation in the docs:
 * https://dashboard.snapcraft.io/docs/reference/v1/snap.html#release-a-snap-build-to-a-channel
 */
export type FetchReleasePayload = {
  id: number;
  revision: PendingReleaseItem["revision"];
  channels: PendingReleaseItem["channel"][];
  progressive: PendingReleaseItem["progressive"] | null;
};

export type ReleaseChannel = {
  channel: Channel["risk"];
  info: string;
  version?: string;
  revision?: number;
};

type ReleaseErrorResponse = {
  success: false;
  errors: string[];
};

type ArchitectureReleaseChannelMap = {
  [arch in CPUArchitecture]: ReleaseChannel[];
};

export type FetchReleaseResponse =
  | {
      success: true;
      channel_map: ReleaseChannel[];
      channel_map_tree: {
        [track in Channel["track"]]: {
          [series in Series]: ArchitectureReleaseChannelMap;
        };
      };
      opened_channels: string[];
    }
  | ReleaseErrorResponse;

export type CloseChannelsResponse =
  | {
      success: true;
      channel_maps: ArchitectureReleaseChannelMap;
      closed_channels: string[];
    }
  | ReleaseErrorResponse;

/**
 * Types for the Redux state used in the Releases page
 */
export type ReleasesReduxState = CombinedState<{
  architectures: CPUArchitecture[];
  availableRevisionsSelect: AvailableRevisionsSelect;
  branches: string[]; // TODO: are there any constraints on this?
  channelMap: ChannelArchitectureRevisionsMap;
  currentTrack: string;
  defaultTrack: string;
  history: {
    filters: {
      arch?: Release["architecture"];
      track?: Release["track"];
      risk?: Release["risk"];
      branch?: Release["branch"];
    } | null;
    isOpen: boolean;
    // TODO: more stuff???
  };
  modal: Partial<{
    visible: boolean;
    title: string;
    content: string;
    actions: {
      appearance: "positive" | "neutral" | "negative";
      onClickAction:
        | {
            reduxAction: string;
          }
        | { type: string };
      label: string;
    }[];
  }>;
  notification: Partial<{
    visible: boolean;
    status: "success" | "error";
    appearance: "positive" | "neutral" | "negative";
    content: string;
    canDismiss: boolean;
  }>;
  options: Options;
  pendingCloses: Channel["name"][]; // TODO: are there any constraints on this?
  pendingReleases: {
    [revision: string]: {
      [channel: Channel["name"]]: PendingReleaseItem;
    };
  };
  revisions: {
    [revision: string]: Prettify<
      Revision & {
        channels?: Channel["name"][];
      }
    >;
  };
  failedRevisions: FailedRevision[];
  releases: Release[];
}>;

export type FailedRevision = {
  channel: ChannelMap["channel"];
  architecture: CPUArchitecture;
};

export type ArchitectureRevisionsMap = {
  [arch in CPUArchitecture | string]: Revision;
};

export type ChannelArchitectureRevisionsMap = {
  [channel in Channel["name"]]: ArchitectureRevisionsMap;
};

export type Options = {
  snapName?: string;
  defaultTrack?: string;
  flags: {
    isProgressiveReleaseEnabled?: boolean;
  };
  tracks?: NonEmptyArray<Track>;
};

export type ProgressiveChanges = {
  [Key in keyof Progressive]: {
    key: Key;
    value: Progressive[Key];
  };
}[keyof Progressive][];

export type ProgressiveMutated = Prettify<Progressive & { key?: number }>; // TODO: why/when is this a thing?

export type PendingReleaseItem = {
  revision: Prettify<
    Revision & {
      // when are these added?
      release?: Release & { progressive: ProgressiveMutated };
      releases?: Release[];
    }
  >;
  channel: Channel["name"];
  previousReleases: Revision[];
  progressive: Prettify<
    Progressive & {
      changes?: ProgressiveChanges;
    }
  >;
  replaces: {
    revision: Revision;
    channel: Channel["name"];
    progressive: Progressive;
  };
};

/**
 * Helper types for the Redux actions and Dispatch
 */
export type DispatchFn = ThunkDispatch<
  ReleasesReduxState,
  unknown,
  ReleasesAction
>;

export type ReleasesAction = {
  type: string;
  payload?: unknown; // actions are so messed up that there's no good way to type this
};
