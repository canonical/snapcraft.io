import * as Sentry from "@sentry/react";
import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import BrandStoreRoute from "./components/BrandStoreRoute/BrandStoreRoute";
import PublisherLayout from "./layouts/PublisherLayout";
import AccountDetails from "./pages/AccountDetails";
import AccountSnaps from "./pages/AccountSnaps";
import BrandStoreSettings from "./pages/BrandStoreSettings";
import Build from "./pages/Build";
import Builds from "./pages/Builds";
import Listing from "./pages/Listing";
import Members from "./pages/Members";
import Metrics from "./pages/Metrics";
import Model from "./pages/Model";
import Policies from "./pages/Model/Policies";
import Models from "./pages/Models";
import Publicise from "./pages/Publicise";
import PublisherSettings from "./pages/PublisherSettings";
import RegisterNameDispute from "./pages/RegisterNameDispute";
import RegisterSnap from "./pages/RegisterSnap";
import Releases from "./pages/Releases";
import RequestReservedName from "./pages/RequestReservedName";
import SigningKeys from "./pages/SigningKeys";
import Snaps from "./pages/Snaps";
import ValidationSet from "./pages/ValidationSet";
import ValidationSets from "./pages/ValidationSets";

Sentry.init({
  dsn: window.SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
});

const rootEl = document.getElementById("root")! as HTMLElement;
const root = createRoot(rootEl);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
});

root.render(
  <JotaiProvider>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublisherLayout />}>
            <Route path=":snapId">
              <Route path="publicise" element={<Publicise />} />
              <Route
                path="publicise/badges"
                element={<Publicise view="badges" />}
              />
              <Route
                path="publicise/cards"
                element={<Publicise view="cards" />}
              />
              <Route path="settings" element={<PublisherSettings />} />
              <Route path="metrics" element={<Metrics />} />
              <Route path="listing" element={<Listing />} />
              <Route path="builds" element={<Builds />} />
              <Route path="builds/:buildId" element={<Build />} />
              <Route path="releases" element={<Releases />} />
            </Route>

            <Route path="snaps" element={<AccountSnaps />} />
            <Route
              path="register-name-dispute"
              element={<RegisterNameDispute />}
            />
            <Route
              path="request-reserved-name"
              element={<RequestReservedName />}
            />
            <Route path="register-snap" element={<RegisterSnap />} />

            <Route path="validation-sets" element={<ValidationSets />} />
            <Route
              path="validation-sets/:validationSetId"
              element={<ValidationSet />}
            />

            <Route path="admin/account" element={<AccountDetails />} />

            <Route path="admin/:id" element={<BrandStoreRoute />}>
              <Route path="snaps" element={<Snaps />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<BrandStoreSettings />} />
              <Route path="signing-keys" element={<SigningKeys />} />
              <Route path="signing-keys/create" element={<SigningKeys />} />
              <Route path="models">
                <Route index element={<Models />} />
                <Route path="create" element={<Models />} />
                <Route path=":model_id">
                  <Route index element={<Model />} />
                  <Route path="policies" element={<Policies />} />
                  <Route path="policies/create" element={<Policies />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </JotaiProvider>,
);
