type DataLayerEvent = {
  event: string;
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
  eventValue?: string | undefined;
};

declare interface Window {
  dataLayer: Array<DataLayerEvent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chrome: any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MktoForms2: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Vimeo: any;
  DNS_VERIFICATION_TOKEN: string;
  SENTRY_DSN: string;
  CSRF_TOKEN: string;
  SNAP_LISTING_DATA: {
    DNS_VERIFICATION_TOKEN: string;
  };
}
