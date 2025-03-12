import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";

import PublisherRoot from "./routes/publisher-root";
import Publicise from "./pages/Publicise";
import PublisherSettings from "./pages/PublisherSettings";
import ValidationSets from "./pages/ValidationSets";
import ValidationSet from "./pages/ValidationSet";
import Metrics from "./pages/Metrics";
import Listing from "./pages/Listing";
import Builds from "./pages/Builds";
import Build from "./pages/Build";
import Releases from "./pages/Releases";
import AccountSnaps from "./pages/AccountSnaps";
import DeveloperAgreement from "./pages/DeveloperAgreement";
import RegisterNameDispute from "./pages/RegisterNameDispute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublisherRoot />,
    children: [
      {
        path: "/:snapId/publicise",
        element: <Publicise />,
      },
      {
        path: "/:snapId/publicise/badges",
        element: <Publicise view="badges" />,
      },
      {
        path: "/:snapId/publicise/cards",
        element: <Publicise view="cards" />,
      },
      {
        path: "/:snapId/settings",
        element: <PublisherSettings />,
      },
      {
        path: "/validation-sets",
        element: <ValidationSets />,
      },
      {
        path: "/validation-sets/:validationSetId",
        element: <ValidationSet />,
      },
      {
        path: "/:snapId/metrics",
        element: <Metrics />,
      },
      {
        path: "/:snapId/listing",
        element: <Listing />,
      },
      {
        path: "/:snapId/builds",
        element: <Builds />,
      },
      {
        path: "/:snapId/builds/:buildId",
        element: <Build />,
      },
      {
        path: "/:snapId/releases",
        element: <Releases />,
      },
      {
        path: "/snaps",
        element: <AccountSnaps />,
      },
      {
        path: "/account/agreement",
        element: <DeveloperAgreement />,
      },
      {
        path: "/register-name-dispute",
        element: <RegisterNameDispute />,
      },
    ],
  },
]);

const rootEl = document.getElementById("root") as HTMLElement;
const root = createRoot(rootEl);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

root.render(
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </RecoilRoot>,
);
