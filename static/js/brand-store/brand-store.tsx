import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/browser";
import App from "./components/App";
import { store } from "./store";
import { Provider } from "react-redux";
import { RecoilRoot } from "recoil";
Sentry.init({
  dsn: window.SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

const container = document.getElementById("root");
const root = createRoot(container as HTMLDivElement);
root.render(
  <Provider store={store}>
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </Provider>
);
