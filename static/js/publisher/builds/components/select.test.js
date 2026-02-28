import React from "react";
import { render, fireEvent } from "@testing-library/react";

import Select from "./select";

describe("Select", () => {
  const essentialProps = {
    options: [{ value: "test-1" }, { value: "test-2" }],
    updateSelection: jest.fn(),
    selectedOption: "test-1",
  };

  it("should render all the essential components", () => {
    const { container } = render(<Select {...essentialProps} />);

    expect(container.querySelector("select")).toBeDefined();
  });

  it("should render 2 select options", () => {
    const { container } = render(<Select {...essentialProps} />);
    const selectEl = container.querySelector("select");

    expect(selectEl.childNodes.length).toEqual(2);
  });

  it("should call the callback function on change", () => {
    const { container } = render(<Select {...essentialProps} />);
    const selectEl = container.querySelector("select");

    fireEvent.change(selectEl, { target: { value: "test-2" } });
    expect(essentialProps.updateSelection).toHaveBeenCalledTimes(1);
  });
});
