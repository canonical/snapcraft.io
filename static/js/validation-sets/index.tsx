import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

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

root.render(<RouterProvider router={router} />);
