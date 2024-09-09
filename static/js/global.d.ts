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
  SNAP_PUBLICISE_DATA: {
    hasScreenshot: boolean;
    isReleased: boolean;
    private: boolean;
    trending: boolean;
  };
}
