import { initIcon } from "./initIcon";

describe("initIcon", () => {
  it("should throw if there is no icon holder", () => {
    expect(function () {
      initIcon();
    }).toThrow();
  });
});
