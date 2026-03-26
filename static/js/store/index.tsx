import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { trackPageView } from "@canonical/analytics-events";

import Root from "./layouts/Root";
import Store from "./pages/Store";

if (window.ANALYTICS_ENDPOINT) {
  console.log("[analytics] trackPageView: snap_store_page");
  trackPageView("snap_store_page");
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/store",
        element: <Store />,
      },
    ],
  },
]);

const rootElement = document.getElementById("root") as HTMLElement;
const root = createRoot(rootElement)!;
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
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
