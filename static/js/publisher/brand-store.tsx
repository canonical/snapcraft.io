import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/browser";
import BrandStoreRoot from "./routes/brand-store-root";
import { Provider } from "jotai";
Sentry.init({
  dsn: window.SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});

const container = document.getElementById("root");
const root = createRoot(container as HTMLDivElement);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

root.render(
  <Provider>
    <QueryClientProvider client={queryClient}>
      <BrandStoreRoot />
    </QueryClientProvider>
  </Provider>,
);
