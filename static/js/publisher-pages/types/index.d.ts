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

export type SettingsData = {
  blacklist_countries: string[];
  blacklist_country_keys: string;
  countries: Array<{ key: string; name: string }>;
  country_keys_status: string | null;
  private: boolean;
  publisher_name: string;
  snap_id: string;
  snap_name: string;
  snap_title: string;
  status: string;
  store: string;
  territory_distribution_status: string;
  unlisted: boolean;
  update_metadata_on_release: boolean;
  visibility: string;
  visibility_locked: boolean;
  whitelist_countries: string[];
  whitelist_country_keys: string;
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
  tour_steps: Step[];
};

export type GithubData = {
  github_orgs: { name: string }[];
  github_repository: string | null;
  github_user: {
    avatarUrl: string;
    login: string;
    name: string;
  };
};
