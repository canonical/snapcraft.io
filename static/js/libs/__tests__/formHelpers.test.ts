import "@testing-library/jest-dom";
import { buttonLoading, buttonEnabled, buttonDisable } from "../formHelpers";

describe("formHelpers", () => {
  test("button is given loading state", () => {
    const button = document.createElement("button");

    buttonLoading(button, "Loading");

    expect(button).toBeDisabled();
    expect(button.classList).toContain("--dark");
    expect(button).toHaveTextContent("Loading");
  });

  test("button is enabled", () => {
    const button = document.createElement("button");

    button.disabled = true;
    button.classList.add("--dark");
    button.innerText = "Loading";

    buttonEnabled(button, "Save");

    expect(button).not.toBeDisabled();
    expect(button.classList).not.toContain("--dark");
    expect(button).toHaveTextContent("Save");
  });

  test("button is disabled", () => {
    const button = document.createElement("button");

    buttonDisable(button, "Disabled");

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Disabled");
  });
});
