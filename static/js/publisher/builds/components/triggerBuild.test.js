import React from "react";
import { render, fireEvent } from "@testing-library/react";
import TriggerBuild from "./triggerBuild";

describe("TriggerBuild", () => {
  it("renders the trigger new build button and the button triggers a build on click", () => {
    const triggerBuildHandler = jest.fn();
    const { container } = render(
      <TriggerBuild onClick={triggerBuildHandler} />
    );
    const btn = container.querySelector("button");
    expect(btn.innerHTML).toEqual("Trigger new build");
    fireEvent.click(btn);
    expect(triggerBuildHandler.mock.calls.length).toEqual(1);
  });

  it("renders with an error", () => {
    const { container } = render(<TriggerBuild hasError={true} />);
    expect(container.querySelector(".p-notification__title").innerHTML).toEqual(
      "Error:"
    );
  });

  it("renders the requesting button with an icon", () => {
    const { container } = render(<TriggerBuild isLoading={true} />);
    expect(container.querySelector("span").innerHTML).toEqual("Requesting");
    expect(container.querySelector("i")).toBeTruthy();
  });
});
