import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

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
import RegisterNameDispute from "./pages/RegisterNameDispute";
import RequestReservedName from "./pages/RequestReservedName";
import RegisterSnap from "./pages/RegisterSnap";
import SnapCves from "./pages/SnapCves";

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
        path: "/:snapId/cves",
        element: <SnapCves />,
      },
      {
        path: "/snaps",
        element: <AccountSnaps />,
      },
      {
        path: "/register-name-dispute",
        element: <RegisterNameDispute />,
      },
      {
        path: "/request-reserved-name",
        element: <RequestReservedName />,
      },
      {
        path: "/register-snap",
        element: <RegisterSnap />,
      },
    ],
  },
]);

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
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </RecoilRoot>,
);
