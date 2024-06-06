import "@testing-library/jest-dom";
import { isMobile } from "../mobile";

describe("isMobile", () => {
  test("returns false if button isn't visible", () => {
    const button = document.createElement("button");

    button.classList.add("p-navigation__toggle--open");
    document.body.appendChild(button);

    expect(isMobile()).toBe(false);
  });

  test("returns true if button is visible", () => {
    const button = document.createElement("button");

    button.classList.add("p-navigation__toggle--open");

    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 10,
    });

    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 10,
    });

    document.body.appendChild(button);

    expect(isMobile()).toBe(true);
  });
});
