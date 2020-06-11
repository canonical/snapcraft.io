import React from "react";
import { render, fireEvent } from "@testing-library/react";

import DatalistSelect from "./datalistSelect";

describe("DatalistSelect", () => {
  const essentialProps = {
    listId: "repo-list",
    options: [{ value: "test-repo-1" }, { value: "test-repo-2" }],
    updateSelection: jest.fn(),
    selectedOption: "test-org-2",
  };

  it("should render all the essential components", () => {
    const { container } = render(<DatalistSelect {...essentialProps} />);

    expect(container.querySelector("input")).toBeDefined();
    expect(container.querySelector("datalist")).toBeDefined();
  });

  it("should render input with 'test-org-2' value ", () => {
    const { container } = render(<DatalistSelect {...essentialProps} />);
    const inputEl = container.querySelector("input");

    expect(inputEl.value).toEqual("test-org-2");
  });

  it("should render 2 datalist options", () => {
    const { container } = render(<DatalistSelect {...essentialProps} />);
    const datalistEl = container.querySelector("datalist");

    expect(datalistEl.childNodes.length).toEqual(2);
  });

  it("should call the callback function on change", () => {
    const { container } = render(<DatalistSelect {...essentialProps} />);
    const inputEl = container.querySelector("input");

    fireEvent.change(inputEl, { target: { value: "test-repo-1" } });
    expect(essentialProps.updateSelection).toHaveBeenCalledTimes(1);
  });

  it("should render the loading icon when loading", () => {
    const { container } = render(
      <DatalistSelect {...essentialProps} isLoading={true} />
    );
    const iconClassList = container.querySelector(".p-icon-container")
      .firstChild.classList;

    expect(iconClassList.contains("p-icon--spinner")).toBeTruthy();
    expect(iconClassList.contains("u-animation--spin")).toBeTruthy();
  });
});
