type DataLayerEvent = {
  event: string;
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
  eventValue?: string | undefined;
};

declare interface Window {
  dataLayer: Array<DataLayerEvent>;
}
