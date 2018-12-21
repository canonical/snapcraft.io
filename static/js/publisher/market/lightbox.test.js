import lightbox from "./lightbox";

describe("lightbox", () => {
  afterEach(() => {
    document.querySelector(".vbox-preloader").remove();
    document.querySelector(".vbox-container").remove();
    document.querySelector(".vbox-title").remove();
    document.querySelector(".vbox-num").remove();
    document.querySelector(".vbox-close").remove();
    document.querySelector(".vbox-next").remove();
    document.querySelector(".vbox-prev").remove();
  });

  describe("standard images", () => {
    const urls = [
      "https://dashboard.snapcraft.io/site_media/appmedia/2018/12/space_06hkcxJ.png"
    ];
    const images = urls.map(src => {
      const img = new Image();
      img.src = src;
    });

    beforeEach(() => {
      lightbox.openLightbox(urls[0], images);
    });

    it("inits", () => {
      expect(document.querySelector(".vbox-preloader")).toBeDefined();
      expect(document.querySelector(".vbox-container")).toBeDefined();
      expect(document.querySelector(".vbox-content")).toBeDefined();
      expect(document.querySelector(".vbox-title")).toBeDefined();
      expect(document.querySelector(".vbox-num")).toBeDefined();
      expect(document.querySelector(".vbox-close")).toBeDefined();
      expect(document.querySelector(".vbox-next")).toBeDefined();
      expect(document.querySelector(".vbox-prev")).toBeDefined();
    });
  });

  describe("gifs", () => {
    const urls = ["https://media.giphy.com/media/gw3IWyGkC0rsazTi/giphy.gif"];
    const images = urls.map(src => {
      const img = new Image();
      img.src = src;
    });

    beforeEach(() => {
      lightbox.openLightbox(urls[0], images);
    });

    it("inits", () => {
      expect(document.querySelector(".vbox-preloader")).toBeDefined();
      expect(document.querySelector(".vbox-container")).toBeDefined();
      expect(document.querySelector(".vbox-content")).toBeDefined();
      expect(document.querySelector(".vbox-title")).toBeDefined();
      expect(document.querySelector(".vbox-num")).toBeDefined();
      expect(document.querySelector(".vbox-close")).toBeDefined();
      expect(document.querySelector(".vbox-next")).toBeDefined();
      expect(document.querySelector(".vbox-prev")).toBeDefined();
    });
  });
});
