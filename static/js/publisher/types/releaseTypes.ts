export type Progressive = {
  "current-percentage": number | null;
  paused: boolean | null;
  percentage: number | null;
};

export type Release = {
  architecture: string;
  branch: string | null;
  channel: string;
  "expiration-date": string | null;
  progressive: Progressive;
  revision: number | null;
  risk: string;
  track: string;
  when: string;
};

export type Revision = {
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
};

export type Channel = {
  branch: string | null;
  fallback: string | null;
  name: string;
  risk: string;
  track: string;
};

export type Track = {
  "creation-date": string | null;
  name: string;
  status: string;
  "version-pattern": string | null;
};

export type Snap = {
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
};

export type ReleasesData = {
  _links: {
    self: string;
  };
  releases: Release[];
  revisions: Revision[];
  snap: Snap;
};

export type ChannelMap = {
  architecture: string;
  channel: string;
  "expiration-date": string | null;
  progressive: Progressive;
  revision: number | null;
  when: string;
};

export type Options = {
  defaultTrack: string;
  flags: {
    isProgressiveReleaseEnabled: boolean;
  };
};
