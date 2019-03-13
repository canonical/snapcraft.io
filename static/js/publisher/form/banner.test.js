import React from "react";
import { render, fireEvent } from "react-testing-library";

import Banner from "./banner";

const backgroundSelector = ".p-market-banner__image";
const iconSelector = ".p-market-banner__icon";

function renderBanner(bannerImage, bannerIcon, updateState) {
  if (bannerImage && bannerIcon && updateState) {
    return render(
      <Banner
        bannerImage={bannerImage}
        bannerIcon={bannerIcon}
        updateImageState={updateState}
      />
    );
  }
  if (bannerImage && bannerIcon) {
    return render(<Banner bannerImage={bannerImage} bannerIcon={bannerIcon} />);
  }
  if (bannerImage && updateState) {
    return render(
      <Banner bannerImage={bannerImage} updateImageState={updateState} />
    );
  }
  if (bannerIcon && updateState) {
    return render(
      <Banner bannerIcon={bannerIcon} updateImageState={updateState} />
    );
  }
  if (bannerImage) {
    return render(<Banner bannerImage={bannerImage} />);
  }
  if (bannerIcon) {
    return render(<Banner bannerIcon={bannerIcon} />);
  }

  return render(<Banner />);
}

describe("Banner", () => {
  it("should render with no props", () => {
    const { container } = renderBanner();

    expect(
      container.querySelectorAll(".p-market-banner__images").length
    ).toEqual(1);
  });

  describe("background image", () => {
    it("should show the background image if set at render", () => {
      const { container } = renderBanner({ url: "banner.png" });

      expect(
        container.querySelector(backgroundSelector).style.backgroundImage
      ).toEqual("url(banner.png)");
    });

    it("should show an error if filename isn't 'banner' when adding", () => {
      const { container } = renderBanner();

      window.URL = {
        createObjectURL: () => {
          return "not-banner-image.png";
        }
      };

      const fileContents = "test";
      const file = new File([fileContents], "not-banner-image.png", {
        type: "image/png"
      });

      const input = container.querySelector(`[name="banner-image"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      fireEvent.change(input);

      expect(
        container.querySelectorAll(".p-notification--negative").length
      ).toEqual(1);
    });

    it("should set the background if the filename is 'banner' when adding", () => {
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

      fireEvent.click(container.querySelector(backgroundSelector));
      fireEvent.change(input);

      expect(
        container.querySelectorAll(".p-notification--negative").length
      ).toEqual(0);
      expect(
        container.querySelector(backgroundSelector).style.backgroundImage
      ).toEqual("url(banner.png)");
    });

    it("should remove the background when delete is clicked", () => {
      const cb = jest.fn();
      const { container } = renderBanner(
        {
          url: "banner.png"
        },
        null,
        cb
      );

      const deleteButton = container
        .querySelector(backgroundSelector)
        .querySelector(".p-market-banner__remove");

      fireEvent.click(deleteButton);

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual([]);
    });
  });

  describe("icon image", () => {
    it("should show the background image if set at render", () => {
      const { container } = renderBanner(null, { url: "banner-icon.png" });

      expect(
        container.querySelector(iconSelector).querySelector("img").src
      ).toEqual("banner-icon.png");
    });

    it("should show an error if filename isn't 'banner-icon' when adding", () => {
      const { container } = renderBanner();

      window.URL = {
        createObjectURL: () => {
          return "not-banner-image.png";
        }
      };

      const fileContents = "test";
      const file = new File([fileContents], "not-banner-image.png", {
        type: "image/png"
      });

      const input = container.querySelector(`[name="banner-icon"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      fireEvent.change(input);

      expect(
        container.querySelectorAll(".p-notification--negative").length
      ).toEqual(1);
    });

    it("should set the background if the filename is 'banner-icon' when adding", () => {
      const { container } = renderBanner();

      window.URL = {
        createObjectURL: () => {
          return "banner-icon.png";
        }
      };

      const fileContents = "test";
      const file = new File([fileContents], "banner-icon.png", {
        type: "image/png"
      });

      const input = container.querySelector(`[name="banner-icon"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      fireEvent.click(container.querySelector(iconSelector));
      fireEvent.change(input);

      expect(
        container.querySelectorAll(".p-notification--negative").length
      ).toEqual(0);
      expect(
        container.querySelector(iconSelector).querySelector("img").src
      ).toEqual("banner-icon.png");
    });

    it("should remove the icon when delete is clicked", () => {
      const cb = jest.fn();
      const { container } = renderBanner(
        null,
        {
          url: "banner-icon.png"
        },
        cb
      );

      const deleteButton = container
        .querySelector(iconSelector)
        .querySelector(".p-market-banner__remove");

      fireEvent.click(deleteButton);

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual([]);
    });
  });
});
