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
