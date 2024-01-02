type SettingsData = {
  snap_title: string;
  publisher_name: string;
  snap_name: string;
  snap_id: string;
  store: string;
  status: string;
  update_metadata_on_release: boolean;
  private: boolean;
  unlisted: boolean;
  visibility: string;
  whitelist_countries: Array<string>;
  blacklist_countries: Array<string>;
  territory_distribution_status: string;
  whitelist_country_keys: string;
  blacklist_country_keys: string;
  country_keys_status: string | null;
};

export type { SettingsData };
