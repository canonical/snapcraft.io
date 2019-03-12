import { initMedia } from "./initMedia";

describe("initMedia", () => {
  it("should throw if there is no media holder", () => {
    expect(function() {
      initMedia();
    }).toThrow();
  });

  it("should render to the holder, without images", () => {
    const holder = document.createElement("div");
    holder.id = "media-holder";
    document.body.appendChild(holder);

    initMedia("#media-holder", [], () => {});

    expect(
      holder.querySelectorAll(".p-listing-images__add-image").length
    ).toEqual(1);
  });
});
