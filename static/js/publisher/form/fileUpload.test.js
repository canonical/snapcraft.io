import FileUpload from "./fileUpload";
import React from "react";
import { render, fireEvent } from "react-testing-library";

describe("FileUpload", () => {
  it("should append an input when holder is clicked", () => {
    const { container } = render(
      <FileUpload
        className="test"
        inputName="test-input"
        restrictions={{
          accept: ["image/jpeg"]
        }}
      >
        <span>bewton</span>
      </FileUpload>
    );

    const clickElement = container.querySelector(".test");
    fireEvent.click(clickElement);

    const input = container.querySelector(`[name="test-input"]`);

    expect(input.accept).toEqual("image/jpeg");
  });

  it("should run restrictions when a file changes", done => {
    const cb = jest.fn();
    const { container } = render(
      <FileUpload
        className="test"
        inputName="test-input"
        fileChangedCallback={cb}
        restrictions={{
          accept: ["image/jpeg"]
        }}
      >
        <span>bewton</span>
      </FileUpload>
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

    setTimeout(() => {
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual([file]);
      done();
    }, 500);
  });
});
