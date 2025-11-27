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
  | (string & {}); // use string as a fallback. otherwise the type is too strict and stuff like Object.keys breaks

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
   * (see static/js/publisher/pages/Releases/releasesState.js for more info)
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
  modal: {
    visible: boolean;
    // TODO: more stuff???
  };
  notification: {
    visible: boolean;
    // TODO: more stuff???
  };
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
  failedRevisions: unknown[]; // TODO: what's this ???
  releases: Release[];
}>;

export type ArchitectureRevisionsMap = {
  [arch in CPUArchitecture]: Revision & { releases: Release[] };
};

export type ChannelArchitectureRevisionsMap = {
  [channel in Channel["name"] | "AVAILABLE"]: ArchitectureRevisionsMap;
};

export type Options = {
  snapName: string;
  defaultTrack: string;
  flags: {
    isProgressiveReleaseEnabled: boolean;
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
      release?: Release & { progressive: ProgressiveMutated };
      releases: Release[];
    }
  >; // when is this "release" member added?
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
  {
    type: string;
    payload?: unknown; // actions are so messed up that there's no good way to type this
  }
>;
