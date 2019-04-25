import React from "react";
import { render, fireEvent } from "react-testing-library";

import Banner from "./banner";

const backgroundSelector = ".p-market-banner__image img";

describe("Banner", () => {
  it("should render with no props", () => {
    const { container } = render(<Banner />);

    expect(
      container.querySelectorAll(".p-market-banner__image-holder").length
    ).toEqual(1);
  });

  describe("background image", () => {
    it("should show the background image if set at render", () => {
      const { container } = render(
        <Banner bannerImage={{ url: "banner.png" }} />
      );

      expect(container.querySelector(backgroundSelector).src).toEqual(
        "banner.png"
      );
    });

    it("should set the background if image added", done => {
      const { container } = render(<Banner />);

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
        expect(container.querySelector(backgroundSelector).src).toEqual(
          "banner.png"
        );
        done();
      }, 500);
    });

    it("should show an error if a restriction isn't met", done => {
      const { container } = render(
        <Banner
          restrictions={{
            accept: ["image/jpeg"]
          }}
        />
      );

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
      const { container } = render(
        <Banner
          bannerImage={{
            url: "banner.png"
          }}
          updateImageState={cb}
        />
      );

      const deleteButton = container.querySelector(".p-market-banner__remove");

      fireEvent.click(deleteButton);

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(null);
    });

    it("should remove the background when backspace is pressed", () => {
      const cb = jest.fn();
      const { container } = render(
        <Banner
          bannerImage={{
            url: "banner.png"
          }}
          updateImageState={cb}
        />
      );

      const backgroundImage = container.querySelector(backgroundSelector);

      fireEvent.keyDown(backgroundImage, {
        key: "Backspace"
      });

      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(null);
    });

    it("should set focus class when focused and remove it on blur", () => {
      const { container } = render(
        <Banner bannerImage={{ url: "banner.png" }} />
      );

      const image = container.querySelector(backgroundSelector);
      fireEvent.focus(image);
      expect(container.querySelectorAll(".is-focused").length).toEqual(1);

      fireEvent.blur(image);
      expect(container.querySelectorAll(".is-focused").length).toEqual(0);
    });
  });
});
