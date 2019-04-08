import React from "react";
import { render, fireEvent } from "react-testing-library";
import AccordionHelp from "./AccordionHelp";

describe("AccordionHelp", () => {
  it("renders with a title", () => {
    const { container } = render(<AccordionHelp name="test" />);
    expect(container.querySelector("a").innerHTML).toEqual("Show test");
  });

  it("opens when toggled", () => {
    const { container } = render(
      <AccordionHelp name="test">
        <div className="todd" />
      </AccordionHelp>
    );
    const aEl = container.querySelector("a");
    fireEvent.click(aEl);
    expect(aEl.innerHTML).toEqual("Hide test");
    expect(container.querySelectorAll(".todd").length).toEqual(1);
  });
});
