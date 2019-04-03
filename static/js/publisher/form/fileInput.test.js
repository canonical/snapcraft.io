import FileInput from "./fileInput";
import React from "react";
import { render, fireEvent } from "react-testing-library";
import * as fileValidation from "../../libs/fileValidation";

describe("FileInput", () => {
  it("should append an input when holder is clicked", () => {
    const { container } = render(
      <FileInput
        className="test"
        inputName="test-input"
        restrictions={{
          accept: ["image/jpeg"]
        }}
      >
        <span>bewton</span>
      </FileInput>
    );

    const clickElement = container.querySelector(".test");
    fireEvent.click(clickElement);

    const input = container.querySelector(`[name="test-input"]`);

    expect(input.accept).toEqual("image/jpeg");
  });

  it("should run restrictions when a file changes", () => {
    const mock = jest.spyOn(fileValidation, "validateRestrictions");

    const { container } = render(
      <FileInput
        className="test"
        inputName="test-input"
        restrictions={{
          accept: ["image/jpeg"]
        }}
      >
        <span>bewton</span>
      </FileInput>
    );
    const clickElement = container.querySelector(".test");

    fireEvent.click(clickElement);

    const input = container.querySelector(`[name="test-input"]`);

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    fireEvent.change(input, {
      target: {
        files: [file]
      }
    });

    expect(mock.mock.calls.length).toEqual(1);
    mock.mockRestore();
  });

  it("should create a new image if return is pressed on add image", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(`[name="file-upload"]`);
    const clickCb = jest.fn();

    input.addEventListener("click", clickCb);

    const addButton = container.querySelector(".p-file-input");

    fireEvent.keyDown(addButton, { key: "Enter", code: 13, charCode: 13 });

    expect(clickCb.mock.calls.length).toEqual(1);
  });

  it("should add drag related event listeners to document on mount", () => {
    const addEventListener = jest.spyOn(document, "addEventListener");

    render(<FileInput />);

    const dragRelatedCalls = addEventListener.mock.calls.filter(
      call => call[0].indexOf("drag") > -1 || call[0].indexOf("drop") > -1
    );

    expect(dragRelatedCalls.length).toEqual(3);
  });

  it("should remove drag related event listeners from document on unmount", () => {
    const removeEventListener = jest.spyOn(document, "removeEventListener");

    const { unmount } = render(<FileInput />);

    unmount();

    const dragRelatedCalls = removeEventListener.mock.calls.filter(
      call => call[0].indexOf("drag") > -1 || call[0].indexOf("drop") > -1
    );

    expect(dragRelatedCalls.length).toEqual(3);
  });

  it("should set the class `is-dragging` when a file is dragged onto the document", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(".p-file-input");

    fireEvent.dragOver(container, {
      target: {
        dataTransfer: {
          types: ["Files"],
          items: [1]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
  });

  it("should remove the class `is-dragging` when a file is dropped outside of the component", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(".p-file-input");

    fireEvent.dragOver(container, {
      target: {
        dataTransfer: {
          types: ["Files"],
          items: [1]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
    fireEvent.drop(container, {
      target: {
        dataTransfer: {
          items: [1]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(false);
  });

  it("should add the class `can-drop` when a file is dragged over the component", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(".p-file-input");

    fireEvent.dragOver(container, {
      target: {
        dataTransfer: {
          types: ["Files"],
          items: [1]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
    const target = input.parentNode;
    Object.defineProperties(target, {
      dataTransfer: {
        items: [1],
        files: [new File(["test"], "test.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.dragOver(input, {
      target: target
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
    expect(input.classList.contains("can-drop")).toEqual(true);
  });

  it("should cancel dragging when exiting the window", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(".p-file-input");

    fireEvent.dragOver(container, {
      target: {
        dataTransfer: {
          types: ["Files"],
          items: [1]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
    fireEvent.dragExit(input, {
      target: {
        relatedTarget: null
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(false);
    expect(input.classList.contains("can-drop")).toEqual(false);
  });

  it("should show a warning if more than 1 image is dragged", () => {
    const { container } = render(<FileInput />);
    const input = container.querySelector(".p-file-input");

    fireEvent.dragOver(container, {
      target: {
        dataTransfer: {
          types: ["Files"],
          items: [1, 2]
        }
      }
    });
    expect(input.classList.contains("is-dragging")).toEqual(true);
    expect(input.classList.contains("over-limit")).toEqual(true);
  });
});
