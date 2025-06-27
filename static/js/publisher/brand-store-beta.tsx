import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import * as Sentry from "@sentry/react";

import BrandStoreBetaRoute from "./routes/brand-store-beta-root";

Sentry.init({ dsn: window.SENTRY_DSN });

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <BrandStoreBetaRoute />
  </QueryClientProvider>,
);
