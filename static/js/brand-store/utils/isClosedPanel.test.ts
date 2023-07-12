import isClosedPanel from "./isClosedPanel";

describe("isClosedPanel", () => {
  it("returns true if key isn't at the end of the path", () => {
    expect(isClosedPanel("/this/is/a/path", "test")).toBe(true);
  });

  it("returns false if key isn't at the end of the path", () => {
    expect(isClosedPanel("/this/is/a/path", "path")).toBe(false);
  });
});
