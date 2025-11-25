import { CombinedState } from "redux";

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
  | "s390x";

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
};

export type Revision = {
  architectures: NonEmptyArray<CPUArchitecture>;
  attributes: {
    "build-request-id"?: string;
    "build-request-timestamp"?: ISO8601Timestamp;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // store docs declare this as a generic "object" type
  };
  base: string; // "coreXX"
  build_url: string | null; // available if it's a Launchpad build
  confinement: "strict" | "classic" | "devmode";
  created_at: ISO8601Timestamp;
  epoch: {
    read: NonEmptyArray<number>;
    write: NonEmptyArray<number>;
  };
  grade: "stable" | "devel";
  revision: number;
  "sha3-384": string;
  size: number;
  status:
    | "Published"
    | "Unpublished"
    | "ManualReviewPending"
    | "NeedsInformation"
    | "AutomaticallyRejected"
    | "Rejected";
  version: string;
};

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
  // docs might be wrong because they mark "pattern" as required but it doesn't exist
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
 * Types for response to GET "/api/v2/snaps/(?P<name>[\\w-]+)/releases"
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
 * Types for response to GET "/api/v2/snaps/(?P<name>[\\w-]+)/channel-map"
 * We only use the "channel-map" member of the response object, so we ignore "revisions" and "snap"
 *
 * All referenced types are based on the JSON schema provided in the docs:
 * https://dashboard.snapcraft.io/docs/reference/v2/en/snaps.html#id3
 */
export type ChannelMap = {
  architecture: CPUArchitecture;
  channel: string;
  "expiration-date": ISO8601Timestamp | null;
  progressive: Progressive;
  revision: number | null;
  when: ISO8601Timestamp;
};

export type Options = {
  defaultTrack: string;
  flags: {
    isProgressiveReleaseEnabled: boolean;
  };
  tracks?: NonEmptyArray<Track>;
};

export type ReleasesAPIResponse = {
  channel_map: ChannelMap[];
  default_track: string;
  private: false;
  publisher_name: string;
  release_history: ReleasesData;
  snap_name: "edisile-pyfiglet";
  snap_title: "edisile-pyfiglet";
  tracks: NonEmptyArray<Track>;
};

export type ProgressiveChanges = {
  [Key in keyof Progressive]: {
    key: Key;
    value: Progressive[Key];
  };
}[keyof Progressive][];

export type ProgressiveMutated = Progressive & { key?: any }; // TODO: why/when is this a thing?

export type PendingReleaseItem = {
  revision: Revision & {
    release?: Release & { progressive: ProgressiveMutated };
  }; // when is this "release" member added?
  channel: Channel["name"];
  previousReleases: Revision[];
  progressive: Progressive & {
    changes?: ProgressiveChanges;
  };
  replaces: any; // ???
};

export type PendingReleases = {
  [revision: string]: {
    [channel: string]: PendingReleaseItem;
  };
};

/**
 * Types for the Redux state used in the Releases page
 */
export type ReleasesReduxState = CombinedState<{
  architectures: CPUArchitecture[];
  // TODO: these come from "../pages/Releases/constants", what should we do with them?
  availableRevisionsSelect: AvailableRevisionsSelect;
  branches: string[]; // TODO: wat do?
  channelMap: Record<
    Channel["name"] | "AVAILABLE",
    Partial<Record<CPUArchitecture, Revision>>
  >;
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
  modal: {
    visible: boolean;
    // TODO: more stuff???
  };
  notification: {
    visible: boolean;
    // TODO: more stuff???
  };
  options: Options;
  pendingCloses: Channel["name"][]; // ???
  pendingReleases: PendingReleases;
  revisions: {
    [revision: string]: Revision & {
      channels?: Channel["name"][];
    };
  };
  releases: (Release & {
    isProgressive?: boolean;
  })[];
}>;
