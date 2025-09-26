import { Provider as JotaiProvider } from "jotai";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import * as Sentry from "@sentry/react";

import { importComponent } from "./utils/importComponent";

const PublisherLayout = importComponent(
  () => import("./layouts/PublisherLayout"),
);
const BrandStoreLayout = importComponent(
  () => import("./layouts/BrandStoreLayout"),
);

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
          {/* START publisher routes */}
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
          </Route>
          {/* END publisher routes */}

          {/* START brand store routes */}
          <Route path="admin" element={<BrandStoreLayout />}>
            <Route path="account" element={<AccountDetails />} />
            <Route path=":id">
              <Route index element={<Snaps />} />
              <Route path="snaps" element={<Snaps />} />
              <Route path="members" element={<Members />} />
              <Route path="settings" element={<BrandStoreSettings />} />
              <Route path="models" element={<Models />} />
              <Route path="models/create" element={<Models />} />
              <Route path="models/:model_id" element={<Model />} />
              <Route path="models/:model_id/policies" element={<Policies />} />
              <Route
                path="models/:model_id/policies/create"
                element={<Policies />}
              />
              <Route path="signing-keys" element={<SigningKeys />} />
              <Route path="signing-keys/create" element={<SigningKeys />} />
            </Route>
          </Route>
          {/* END brand store routes */}
          {/* TODO: merge the two layouts */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </JotaiProvider>,
);
