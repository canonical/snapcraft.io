import { initBanner } from "./initBanner";

const bannerBackgroundSelector = ".p-market-banner__image";
const bannerIconSelector = ".p-market-banner__icon";

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

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(1);
    expect(holder.querySelectorAll(bannerIconSelector).length).toEqual(1);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);

    expect(
      holder.querySelector(bannerBackgroundSelector).style.backgroundImage
    ).toEqual("");
    expect(
      holder.querySelector(bannerIconSelector).querySelectorAll("img").length
    ).toEqual(0);
  });

  it("should render to the holder, with only a background", () => {
    initBanner(
      ".test",
      {
        images: [
          {
            url: "/banner_123123.png",
            type: "screenshot",
            status: "uploaded",
            isBanner: true
          }
        ]
      },
      () => {}
    );

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(1);
    expect(holder.querySelectorAll(bannerIconSelector).length).toEqual(1);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);

    expect(
      holder.querySelector(bannerBackgroundSelector).style.backgroundImage
    ).toEqual("url(/banner_123123.png)");
    expect(
      holder.querySelector(bannerIconSelector).querySelectorAll("img").length
    ).toEqual(0);
  });

  it("should render to the holder, with only an icon", () => {
    initBanner(
      ".test",
      {
        images: [
          {
            url: "/banner-icon_123123.png",
            type: "screenshot",
            status: "uploaded",
            isBanner: true
          }
        ]
      },
      () => {}
    );

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(1);
    expect(holder.querySelectorAll(bannerIconSelector).length).toEqual(1);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);

    expect(
      holder.querySelector(bannerBackgroundSelector).style.backgroundImage
    ).toEqual("");
    expect(
      holder.querySelector(bannerIconSelector).querySelectorAll("img").length
    ).toEqual(1);
  });

  it("should render to the holder, with both a background and an icon", () => {
    initBanner(
      ".test",
      {
        images: [
          {
            url: "/banner_123123.png",
            type: "screenshot",
            status: "uploaded",
            isBanner: true
          },
          {
            url: "/banner-icon_123123.png",
            type: "screenshot",
            status: "uploaded",
            isBanner: true
          }
        ]
      },
      () => {}
    );

    expect(holder.querySelectorAll(bannerBackgroundSelector).length).toEqual(1);
    expect(holder.querySelectorAll(bannerIconSelector).length).toEqual(1);
    expect(holder.querySelectorAll(`[name="banner-image"]`).length).toEqual(1);

    expect(
      holder.querySelector(bannerBackgroundSelector).style.backgroundImage
    ).toEqual("url(/banner_123123.png)");
    expect(
      holder.querySelector(bannerIconSelector).querySelectorAll("img").length
    ).toEqual(1);
  });
});
