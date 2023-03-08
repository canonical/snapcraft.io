import { initBanner } from "./initBanner";

describe("initBanner", () => {
  let holder;

  beforeEach(() => {
    holder = document.createElement("div");
    holder.className = "test";
    document.body.appendChild(holder);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should throw if there is no bannerHolderEl", () => {
    expect(function () {
      initBanner(".testing-it");
    }).toThrow();
  });
});
