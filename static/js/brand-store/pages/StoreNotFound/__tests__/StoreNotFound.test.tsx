import { render } from "@testing-library/react";
import "@testing-library/jest-dom";

import StoreNotFound from "../StoreNotFound";

describe("StoreNotFound", () => {
  test("sets the page title", () => {
    render(<StoreNotFound />);
    expect(document.title).toBe("Store not found - Snapcraft");
  });
});
