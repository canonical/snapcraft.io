import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";

import Root from "./routes/root";
import ValidationSets from "./pages/ValidationSets";
import ValidationSet from "./pages/ValidationSet";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/validation-sets",
        element: <ValidationSets />,
      },
      {
        path: "/validation-sets/:validationSetId",
        element: <ValidationSet />,
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
