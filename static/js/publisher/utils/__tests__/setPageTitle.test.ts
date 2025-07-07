import "@testing-library/jest-dom";

import setPageTitle from "../setPageTitle";

describe("setPageTitle", () => {
  test("sets page title correctly", () => {
    setPageTitle("Test snap listing");
    expect(document.title).toEqual("Test snap listing - Snapcraft");
  });
});
