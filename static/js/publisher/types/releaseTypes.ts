import { CombinedState } from "redux";

type NonEmptyArray<T> = [T, ...T[]];

type ISO8601Timestamp = string;

/**
 * Distinct type for strings for supported architectures
 *
 * List based on the Snapcraft docs:
 * https://documentation.ubuntu.com/snapcraft/stable/reference/architectures/#supported-architectures
 */
type Architecture =
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
  architecture: Architecture;
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
  architectures: NonEmptyArray<Architecture>;
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
  name: string;
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
  architecture: Architecture;
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

/**
 * Types for the Redux state used in the Releases page
 */
export type State = CombinedState<{
  // TODO: understand how the API data is processed and remove the anys
  architectures: Architecture[];
  availableRevisionsSelect: any;
  branches: any[];
  channelMap: any;
  currentTrack: any;
  defaultTrack: any;
  history: any;
  modal: any;
  notification: any;
  options: {
    flags: {
      isProgressiveReleaseEnabled?: boolean;
    };
    tracks: { name: string }[];
  };
  pendingCloses: any[];
  pendingReleases: any;
  revisions: {
    [k: number]: {
      revision: number;
      version: string;
      attributes: { "build-request-id": string };
    };
  };
  releases: {
    architecture: Architecture;
    revision: number;
    isProgressive?: boolean;
    track: string;
    risk: string;
    branch: string;
  }[];
}>;
