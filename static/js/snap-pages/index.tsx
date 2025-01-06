import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Root from "./routes/root";
import { AccountSnaps } from "./pages/AccountSnaps";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/snaps",
        element: <AccountSnaps />,
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
  </QueryClientProvider>,
);
