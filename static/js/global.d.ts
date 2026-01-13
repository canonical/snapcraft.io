type DataLayerEvent = {
  event: string;
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
  eventValue?: string | undefined;
};

declare interface Window {
  dataLayer: Array<DataLayerEvent>;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: <R>(a: R) => R;
  MktoForms2: {
    loadForm: (
      baseUrl: string,
      munchkinId: string,
      formId: number,
      callback: (form: HTMLFormElement) => void,
    ) => void;
  };
  Vimeo: {
    Player: new (iframe: HTMLIFrameElement) => {
      on: (method: string, callback: () => void) => void;
      play: () => void;
      setVolume: (level: number) => void;
    };
  };
  SENTRY_DSN: string;
  CSRF_TOKEN: string;
  API_URL: string;
  Sentry: Record<string, unknown>;
  COMMIT_ID: string;
  ENVIRONMENT: string;
}

declare module "@canonical/cookie-policy";

declare module "@canonical/global-nav";
