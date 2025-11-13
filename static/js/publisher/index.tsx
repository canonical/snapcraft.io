import * as Sentry from "@sentry/react";
import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import PublisherLayout from "./layouts/PublisherLayout";
import BrandStoreRoute from "./components/BrandStoreRoute/BrandStoreRoute";
import importComponent from "./utils/importComponent";

const AccountDetails = importComponent(() => import("./pages/AccountDetails"));
const AccountSnaps = importComponent(() => import("./pages/AccountSnaps"));
const BrandStoreSettings = importComponent(
  () => import("./pages/BrandStoreSettings"),
);
const Build = importComponent(() => import("./pages/Build"));
const Builds = importComponent(() => import("./pages/Builds"));
const Listing = importComponent(() => import("./pages/Listing"));
const Members = importComponent(() => import("./pages/Members"));
const Metrics = importComponent(() => import("./pages/Metrics"));
const Model = importComponent(() => import("./pages/Model"));
const Models = importComponent(() => import("./pages/Models"));
const Policies = importComponent(() => import("./pages/Model/Policies"));
const Publicise = importComponent(() => import("./pages/Publicise"));
const PublisherSettings = importComponent(
  () => import("./pages/PublisherSettings"),
);
const RegisterNameDispute = importComponent(
  () => import("./pages/RegisterNameDispute"),
);
const RegisterSnap = importComponent(() => import("./pages/RegisterSnap"));
const Releases = importComponent(() => import("./pages/Releases"));
const RequestReservedName = importComponent(
  () => import("./pages/RequestReservedName"),
);
const SigningKeys = importComponent(() => import("./pages/SigningKeys"));
const Snaps = importComponent(() => import("./pages/Snaps"));
const ValidationSet = importComponent(() => import("./pages/ValidationSet"));
const ValidationSets = importComponent(() => import("./pages/ValidationSets"));
const AccountKeys = importComponent(() => import("./pages/AccountKeys"));

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
            <Route path="admin/account-keys" element={<AccountKeys />} />

            <Route path="admin" element={<BrandStoreRoute />} />
            <Route path="admin/:id" element={<BrandStoreRoute />}>
              <Route index element={<Navigate to="snaps" />} />
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
