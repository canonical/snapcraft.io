export interface IReleaseInfo {
  architectures: string[];
  channels: string[];
  revision: number;
  since: string;
  status: string;
  version: string;
}

export interface ISnap {
  snapName: string;
  icon_url: string | null;
  latest_comments: Array<[string: string]>;
  latest_release: IReleaseInfo | null;
  latest_revisions: IReleaseInfo[];
  price: string | null;
  private: boolean;
  publisher: {
    "display-name": string;
    id: string;
    username: string;
    validation: null | Array<[string: string]>;
  };
  since: string;
  "snap-id": string;
  status: string;
  store: string;
  unlisted: boolean;
  is_new?: boolean;
}
