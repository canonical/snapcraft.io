import * as Sentry from "@sentry/react";
import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { importComponent } from "./utils/importComponent";
import BrandStoreRoute from "./components/BrandStoreRoute/BrandStoreRoute";
import PublisherLayout from "./layouts/PublisherLayout";
import SnapsManagementLayout from "./layouts/SnapsManagementLayout";

import AccountSnaps from "./pages/AccountSnaps";
import BrandStoreSettings from "./pages/BrandStoreSettings";
import Members from "./pages/Members";
import Model from "./pages/Model";
import Policies from "./pages/Model/Policies";
import Models from "./pages/Models";
import RegisterNameDispute from "./pages/RegisterNameDispute";
import RegisterSnap from "./pages/RegisterSnap";
import RequestReservedName from "./pages/RequestReservedName";
import SigningKeys from "./pages/SigningKeys";
import Snaps from "./pages/Snaps";
import ValidationSet from "./pages/ValidationSet";
import ValidationSets from "./pages/ValidationSets";
import AccountKeys from "./pages/AccountKeys";

const AccountDetails = importComponent(() => import("./pages/AccountDetails"));
const Publicise = importComponent(() => import("./pages/Publicise"));
const PublisherSettings = importComponent(
  () => import("./pages/PublisherSettings"),
);
const Metrics = importComponent(() => import("./pages/Metrics"));
const Listing = importComponent(() => import("./pages/Listing"));
const Builds = importComponent(() => import("./pages/Builds"));
const Build = importComponent(() => import("./pages/Build"));
const Releases = importComponent(() => import("./pages/Releases"));

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
            <Route path=":snapId" element={<SnapsManagementLayout />}>
              {/*
                if any of the children routes changes, make sure to update
                static/js/publisher/layouts/SnapsManagementLayout/routes.ts
              */}
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
