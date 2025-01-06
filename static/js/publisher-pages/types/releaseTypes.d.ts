export interface Progressive {
  "current-percentage": number | null;
  paused: boolean | null;
  percentage: number | null;
}

export interface Release {
  architecture: string;
  branch: string | null;
  channel: string;
  "expiration-date": string | null;
  progressive: Progressive;
  revision: number | null;
  risk: string;
  track: string;
  when: string;
}

export interface Revision {
  architectures: string[];
  attributes: { [key: string]: string };
  base: string;
  build_url: string | null;
  confinement: string;
  created_at: string;
  epoch: {
    read: number[];
    write: number[];
  };
  grade: string;
  revision: number;
  sha3_384: string;
  size: number;
  status: string;
  version: string;
}

export interface Channel {
  branch: string | null;
  fallback: string | null;
  name: string;
  risk: string;
  track: string;
}

export interface Track {
  "creation-date": string | null;
  name: string;
  status: string;
  "version-pattern": string | null;
}

export interface Snap {
  channels: Channel[];
  "default-track": string | null;
  id: string;
  name: string;
  private: boolean;
  publisher: {
    "display-name": string;
    id: string;
    username: string;
  };
  title: string;
  tracks: Track[];
}

export interface ReleasesData {
  _links: {
    self: string;
  };
  releases: Release[];
  revisions: Revision[];
  snap: Snap;
}

export interface ChannelMap {
  architecture: string;
  channel: string;
  "expiration-date": string | null;
  progressive: Progressive;
  revision: number | null;
  when: string;
}

export interface Options {
  defaultTrack: string;
  csrfToken: string;
  flags: {
    isProgressiveReleaseEnabled: boolean;
  };
}
