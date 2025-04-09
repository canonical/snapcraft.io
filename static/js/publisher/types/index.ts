export type Snap = {
  id: string;
  name: string;
  revision?: number;
  presence?: string;
};

export type ValidationSet = {
  name: string;
  revision?: number;
  sequence?: number;
  snaps: Snap[];
  timestamp: string;
};

export type TourStep = {
  id: string;
  position?: string;
  elements?: HTMLElement[];
  title: string;
  content: string;
};

export type ListingData = {
  snap_id: string;
  title: string;
  video_urls: string;
  summary: string;
  description: string;
  categories: { name: string; slug: string }[];
  primary_category: string;
  secondary_category: string;
  websites: { url: string }[];
  contacts: { url: string }[];
  donations: { url: string }[];
  source_code: { url: string }[];
  issues: { url: string }[];
  primary_website: string;
  public_metrics_enabled: boolean;
  public_metrics_blacklist: string[];
  public_metrics_territories: boolean;
  public_metrics_distros: boolean;
  license: string;
  license_type: string;
  licenses: { key: string; name: string }[];
  icon_url: string;
  screenshot_urls: string[];
  banner_urls: string[];
  update_metadata_on_release: boolean;
  tour_steps: { content: string; id: string; title: string }[];
};

export type GithubData = {
  github_orgs: { name: string; login: string }[];
  github_repository: string | null;
  github_user: {
    avatarUrl: string;
    login: string;
    name: string;
  };
};

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
