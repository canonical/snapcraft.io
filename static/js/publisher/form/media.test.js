import Media from "./media";
import React from "react";
import { render, fireEvent } from "react-testing-library";

describe("Media", () => {
  const imageSelector = ".js-media-item-holder:not(.is-empty)";
  const addImageSelector = ".p-listing-images__add-image";

  it("should render without an image", () => {
    const { container } = render(<Media />);
    expect(container.querySelectorAll(addImageSelector).length).toEqual(1);
  });

  it("should render with an image", () => {
    const { container } = render(
      <Media
        mediaData={[
          {
            url: "test",
            status: "uploaded"
          }
        ]}
      />
    );
    expect(container.querySelectorAll(imageSelector).length).toEqual(1);
    expect(container.querySelector(`[src="test"]`).length).toBeUndefined();
  });

  it("should set the focus state to an item", () => {
    const { container } = render(
      <Media
        mediaData={[
          {
            url: "test",
            status: "uploaded"
          }
        ]}
      />
    );

    const image = container.querySelector(imageSelector);
    image.focus();

    expect(document.activeElement).toEqual(image);
  });

  it("should remove the focus state of an item", () => {
    const { container } = render(
      <Media
        mediaData={[
          {
            url: "test",
            status: "uploaded"
          }
        ]}
      />
    );

    const image = container.querySelector(imageSelector);
    image.focus();

    expect(document.activeElement).toEqual(image);

    jest.setTimeout(1000);
    image.blur();
    expect(document.activeElement).toEqual(document.body);
  });

  it("should show an warning element if too many items are passed", () => {
    const { container } = render(
      <Media
        mediaData={[
          { url: "test", status: "uploaded" },
          { url: "test-2", status: "uploaded" }
        ]}
        mediaLimit={1}
      />
    );

    expect(
      container.querySelectorAll(".p-notification--caution").length
    ).toEqual(1);
  });

  describe("add image", () => {
    let cont;
    let updateState;

    beforeEach(() => {
      updateState = jest.fn();
      const { container } = render(
        <Media
          mediaData={[
            {
              url: "test",
              status: "uploaded"
            }
          ]}
          updateState={updateState}
        />
      );

      const addButton = container.querySelector(addImageSelector);
      addButton.click();

      cont = container;
    });

    it("should add a new image when mediaChanged called", done => {
      // Setup
      window.URL = {
        createObjectURL: () => {
          return "test-upload";
        }
      };
      const fileContents = "testymctestface";
      const file = new File([fileContents], "test", { type: "image/png" });

      const input = cont.querySelector(`[name="screenshots"]`);

      Object.defineProperty(input, "files", {
        value: [file]
      });

      // Start functional bit
      fireEvent.change(input);

      // timeout to wait for the promises to resolve
      setTimeout(() => {
        expect(cont.querySelectorAll(`[src="test"]`).length).toEqual(1);
        expect(
          cont.querySelectorAll(`.js-media-item-holder [src="test-upload"]`)
            .length
        ).toEqual(1);

        expect(updateState.mock.calls.length).toEqual(1);
        expect(updateState.mock.calls[0]).toEqual([
          [
            {
              status: "uploaded",
              url: "test"
            },
            {
              file,
              name: "test",
              status: "new",
              type: "screenshot",
              url: "test-upload"
            }
          ]
        ]);
        done();
      }, 500);
    });
  });

  describe("delete image", () => {
    let cont;
    let updateState;

    beforeEach(() => {
      updateState = jest.fn();
      const { container } = render(
        <Media
          mediaData={[
            {
              url: "test",
              status: "uploaded"
            },
            {
              url: "test-2",
              status: "uploaded"
            },
            {
              url: "test-3",
              status: "uploaded"
            }
          ]}
          updateState={updateState}
        />
      );

      cont = container;
    });

    it("should remove an item from images list", () => {
      const deleteImages = cont.querySelectorAll(
        ".p-listing-images__delete-image"
      );
      expect(deleteImages.length).toEqual(3);

      fireEvent.click(deleteImages[0]);

      expect(updateState.mock.calls.length).toEqual(1);
      expect(updateState.mock.calls[0][0]).toEqual([
        {
          status: "uploaded",
          url: "test-2"
        },
        {
          status: "uploaded",
          url: "test-3"
        }
      ]);

      const newDeleteImages = cont.querySelectorAll(
        ".p-listing-images__delete-image"
      );

      expect(newDeleteImages.length).toEqual(2);
    });
  });

  it("should error when restrictions aren't met", done => {
    const { container } = render(
      <Media
        mediaData={[]}
        restrictions={{
          size: { max: 0.00001 }
        }}
      />
    );

    const addImageButton = container.querySelector(
      ".p-listing-images__add-image"
    );
    fireEvent.click(addImageButton);

    window.URL = {
      createObjectURL: () => {
        return "test-upload";
      }
    };
    const fileContents = "testymctestface";
    const file = new File([fileContents], "test", { type: "image/png" });

    const input = container.querySelector(`[name="screenshots"]`);

    Object.defineProperty(input, "files", {
      value: [file]
    });

    fireEvent.change(input);

    // timeout to wait for the promises to resolve
    setTimeout(() => {
      expect(
        container.querySelectorAll(".p-notification--negative").length
      ).toEqual(1);
      done();
    }, 500);
  });
});
