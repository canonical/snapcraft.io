import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Root from "./routes/root";
import Publicise from "./pages/Publicise";
import Settings from "./pages/Settings";
import ValidationSets from "./pages/ValidationSets";
import ValidationSet from "./pages/ValidationSet";
import Metrics from "./pages/Metrics";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
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
        element: <Settings />,
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
    ],
  },
]);

const rootEl = document.getElementById("root") as HTMLElement;
const root = createRoot(rootEl);

const queryClient = new QueryClient();

root.render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
);
