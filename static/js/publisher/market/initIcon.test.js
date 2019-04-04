import { initIcon } from "./initIcon";

describe("initIcon", () => {
  it("should throw if there is no icon holder", () => {
    expect(function() {
      initIcon();
    }).toThrow();
  });

  it("should render to the holder, without images", () => {
    const holder = document.createElement("div");
    holder.id = "icon-holder";
    document.body.appendChild(holder);

    initIcon("#icon-holder", {}, "snap", () => {});

    expect(holder.querySelectorAll(".p-editable-icon").length).toEqual(1);
  });
});
