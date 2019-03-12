import Media from "./media";
import React from "react";
import { render, fireEvent } from "react-testing-library";

describe("Media", () => {
  const imageSelector = ".js-media-item-holder:not(.is-empty)";
  const addImageSelector = ".p-listing-images__add-image";

  it("should render without an image", () => {
    const { container } = render(
      <Media mediaData={[]} updateState={() => {}} />
    );
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
        updateState={() => {}}
      />
    );
    expect(container.querySelectorAll(imageSelector).length).toEqual(1);
    expect(container.querySelector(`[src="test"]`).length).toBeUndefined();
  });

  it("should render without image, if the only image defined has status of `delete`", () => {
    const { container } = render(
      <Media
        mediaData={[
          {
            url: "test",
            status: "delete"
          }
        ]}
        updateState={() => {}}
      />
    );

    expect(container.querySelectorAll(imageSelector).length).toEqual(0);
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
        updateState={() => {}}
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
        updateState={() => {}}
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
        updateState={() => {}}
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
    it("should add an file input to the dom when adding an image", () => {
      expect(cont.querySelectorAll(`[name="screenshots"]`).length).toEqual(1);
    });

    it("should add a new image on file input change", () => {
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

      input.dispatchEvent(new Event("change"));

      expect(cont.querySelectorAll(`[src="test"]`).length).toEqual(1);
      expect(
        cont.querySelectorAll(`.js-media-item-holder [src="test-upload"]`)
          .length
      ).toEqual(1);

      // The tooltip
      expect(
        cont.querySelectorAll(
          `.p-listing-images__tooltip-image[src="test-upload"]`
        ).length
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

    it("should set an item to be removed", () => {
      const deleteImages = cont.querySelectorAll(
        ".p-listing-images__delete-image"
      );
      expect(deleteImages.length).toEqual(3);

      fireEvent.click(deleteImages[0]);

      expect(updateState.mock.calls.length).toEqual(1);
      expect(updateState.mock.calls[0][0]).toEqual([
        {
          status: "delete",
          url: "test"
        },
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
      expect(
        cont.querySelectorAll(`.p-listing-images__tooltip-image[src="test"]`)
          .length
      ).toEqual(1);
    });

    it("should move focus to the next item if the deleted item is focused", () => {
      const images = cont.querySelectorAll(imageSelector);
      images[0].focus();

      const deleteImage = images[0].querySelector(
        ".p-listing-images__delete-image"
      );
      fireEvent.click(deleteImage);

      expect(document.activeElement).toEqual(images[1]);
    });

    it("should move focus to the add item if the deleted item is focused", () => {
      let images = cont.querySelectorAll(imageSelector);

      const deleteImage1 = images[0].querySelector(
        ".p-listing-images__delete-image"
      );
      fireEvent.click(deleteImage1);

      images = cont.querySelectorAll(imageSelector);

      const deleteImage2 = images[0].querySelector(
        ".p-listing-images__delete-image"
      );
      fireEvent.click(deleteImage2);

      images = cont.querySelectorAll(imageSelector);

      images[0].focus();

      const deleteImage3 = images[0].querySelector(
        ".p-listing-images__delete-image"
      );
      fireEvent.click(deleteImage3);

      expect(document.activeElement).toEqual(
        cont.querySelector(addImageSelector)
      );
    });
  });

  describe("keyboard", () => {
    let cont;

    beforeEach(() => {
      const { container } = render(
        <Media
          mediaData={[
            {
              url: "test",
              status: "uploaded"
            }
          ]}
          updateState={() => {}}
        />
      );

      cont = container;
    });

    it("should create a new image if return is pressed on add image", () => {
      const addButton = cont.querySelector(addImageSelector);
      fireEvent.keyDown(addButton, { key: "Enter", code: 13, charCode: 13 });

      expect(cont.querySelectorAll(`[name="screenshots"]`).length).toEqual(1);
    });
  });
});
