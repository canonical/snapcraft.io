import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import App from "./components/App";

Sentry.init({
  dsn: window.SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
});

const queryClient = new QueryClient();

const container = document.getElementById("main-content");
const root = createRoot(container as HTMLElement);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
