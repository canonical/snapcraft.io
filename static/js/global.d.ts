type DataLayerEvent = {
  event: string;
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
  eventValue?: string | undefined;
};

declare interface Window {
  dataLayer: Array<DataLayerEvent>;
  chrome: any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  MktoForms2: any;
  Vimeo: any;
  DNS_VERIFICATION_TOKEN: string;
  SENTRY_DSN: string;
  CSRF_TOKEN: string;
  SNAP_PUBLICISE_DATA: {
    hasScreenshot: boolean;
    isReleased: boolean;
    private: boolean;
    trending: boolean;
  };
  SNAP_METRICS_DATA: {
    nodata: boolean;
    latest_active_devices: number;
    metric_period: string;
    active_devices_annotations: {
      buckets: string[];
      name: string;
      series: Series[];
    };
    territories_total: number;
    default_track: any;
    active_devices: any;
    active_device_metric: any;
    territories: any;
  };
  SNAP_SETTINGS_DATA: {
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
}
