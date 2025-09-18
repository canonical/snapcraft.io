import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import StoreNotFound from "../StoreNotFound";

// this shouldn't really be necessary, it's just a byproduct of the bad BrandStoreLayout implementation
vi.mock("react-router-dom", () => ({
  useLocation: () => "",
  useParams: () => ({}),
  NavLink: () => <a></a>,
}));

describe("StoreNotFound", () => {
  test("sets the page title", () => {
    render(<StoreNotFound />);
    expect(document.title).toBe("Store not found - Snapcraft");
  });
});
