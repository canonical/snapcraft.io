import React from "react";
import { render, fireEvent } from "react-testing-library";

import Banner from "./banner";

const backgroundSelector = ".p-market-banner__image";

function renderBanner(bannerImage, updateState, restrictions) {
  if (bannerImage && updateState) {
    return render(
      <Banner bannerImage={bannerImage} updateImageState={updateState} />
    );
  }
  if (bannerImage && updateState) {
    return render(
      <Banner bannerImage={bannerImage} updateImageState={updateState} />
    );
  }
  if (updateState) {
    return render(<Banner updateImageState={updateState} />);
  }
  if (bannerImage) {
    return render(<Banner bannerImage={bannerImage} />);
  }

  if (restrictions) {
    return render(
      <Banner
        restrictions={{
          accept: ["image/jpeg"]
        }}
      />
    );
  }

  return render(<Banner />);
}

describe("Banner", () => {
  it("should render with no props", () => {
    const { container } = renderBanner();

    expect(
      container.querySelectorAll(".p-market-banner__image-holder").length
    ).toEqual(1);
  });

  describe("background image", () => {
    it("should show the background image if set at render", () => {
      const { container } = renderBanner({ url: "banner.png" });

      expect(
        container.querySelector(backgroundSelector).style.backgroundImage
      ).toEqual("url(banner.png)");
    });

    it("should set the background if image added", done => {
      const { container } = renderBanner();

      window.URL = {
        createObjectURL: () => {
          return "banner.png";
        }
      };

      const fileContents = "test";
      const file = new File([fileContents], "banner.png", {
        type: "image/png"
      });

      const input = container.querySelector(`[name="banner-image"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      fireEvent.change(input);

      setTimeout(() => {
        expect(
          container.querySelectorAll(".p-notification--negative").length
        ).toEqual(0);
        expect(
          container.querySelector(backgroundSelector).style.backgroundImage
        ).toEqual("url(banner.png)");
        done();
      }, 500);
    });

    it("should show an error if a restriction isn't met", done => {
      const { container } = renderBanner(null, null, true);

      window.URL = {
        createObjectURL: () => {
          return "banner.png";
        }
      };

      const fileContents = "test";
      const file = new File([fileContents], "banner.png", {
        type: "text/html"
      });

      const input = container.querySelector(`[name="banner-image"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      fireEvent.change(input);

      setTimeout(() => {
        expect(
          container.querySelectorAll(".p-notification--negative").length
        ).toEqual(1);
        done();
      }, 500);
    });

    it("should remove the background when delete is clicked", () => {
      const cb = jest.fn();
      const { container } = renderBanner(
        {
          url: "banner.png"
        },
        cb
      );

      const deleteButton = container.querySelector(".p-market-banner__remove");

      fireEvent.click(deleteButton);

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(null);
    });

    it("should remove the background when backspace is pressed", () => {
      const cb = jest.fn();
      const { container } = renderBanner(
        {
          url: "banner.png"
        },
        cb
      );

      const backgroundImage = container.querySelector(backgroundSelector);

      fireEvent.keyDown(backgroundImage, {
        key: "Backspace"
      });

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(null);
    });

    it("should set focus class when focused and remove it on blur", () => {
      const { container } = renderBanner({ url: "banner.png" });

      const image = container.querySelector(backgroundSelector);
      fireEvent.focus(image);
      expect(container.querySelectorAll(".is-focused").length).toEqual(1);

      fireEvent.blur(image);
      expect(container.querySelectorAll(".is-focused").length).toEqual(0);
    });
  });
});
