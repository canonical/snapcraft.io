import { initBanner } from "./initBanner";

const bannerBackgroundSelector = ".p-market-banner__image img";

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
    expect(function() {
      initBanner(".testing-it");
    }).toThrow();
  });

  it("should render to the holder, without images", () => {
    initBanner(".test", [], () => {});

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(0);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);
  });

  it("should render to the holder with a background", () => {
    initBanner(
      ".test",
      [
        {
          url: "/banner_123123.png",
          type: "banner",
          status: "uploaded"
        }
      ],
      () => {}
    );

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(1);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);

    expect(holder.querySelector(bannerBackgroundSelector).src).toEqual(
      "/banner_123123.png"
    );
  });
});
