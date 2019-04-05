import Icon from "./icon";
import React from "react";
import { render, fireEvent } from "react-testing-library";

describe("Icon", () => {
  it("should render without an icon", () => {
    const { container } = render(<Icon updateIcon={() => {}} />);
    expect(container.querySelectorAll(".p-editable-icon__icon").length).toEqual(
      1
    );
    expect(
      container.querySelectorAll(".p-editable-icon__actions").length
    ).toEqual(0);
  });

  it("should render with an icon", () => {
    const { container } = render(
      <Icon icon={{ url: "test" }} updateIcon={() => {}} />
    );
    expect(container.querySelectorAll(`img[src="test"]`).length).toEqual(1);
    expect(
      container.querySelectorAll(".p-editable-icon__actions").length
    ).toEqual(1);
  });

  it("should add a new icon when iconChanged is called", done => {
    window.URL = {
      createObjectURL: () => "test"
    };
    const changeCB = jest.fn();
    const { container } = render(<Icon updateIcon={changeCB} />);

    const file = new File(["test"], "test", { type: "image/png" });
    const input = container.querySelector(`[name="icon"]`);

    Object.defineProperty(input, "files", {
      value: [file]
    });

    fireEvent.change(input);

    setTimeout(() => {
      expect(changeCB.mock.calls.length).toEqual(1);
      expect(changeCB.mock.calls[0]).toEqual([
        {
          file,
          name: "test",
          url: "test",
          status: "new",
          type: "icon"
        }
      ]);
      done();
    }, 500);
  });

  it("should render an error when file doesn't validate", done => {
    window.URL = {
      createObjectURL: () => "test"
    };
    const changeCB = jest.fn();
    const { container } = render(
      <Icon
        updateIcon={changeCB}
        restrictions={{
          accept: ["text/plain"]
        }}
      />
    );

    const file = new File(["test"], "test", { type: "text/html" });
    const input = container.querySelector(`[name="icon"]`);

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

  it("should remove the icon when removeIcon is called", done => {
    const changeCB = jest.fn();
    const { container } = render(
      <Icon icon={{ url: "test" }} updateIcon={changeCB} />
    );

    const deleteButton = container.querySelector(".p-editable-icon__delete");

    expect(deleteButton).toBeDefined();

    fireEvent.click(deleteButton);

    setTimeout(() => {
      expect(changeCB.mock.calls.length).toEqual(1);
      expect(changeCB.mock.calls[0]).toEqual([null]);
      done();
    }, 500);
  });
});
