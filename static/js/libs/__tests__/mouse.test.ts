import "@testing-library/jest-dom";
import mouse from "../mouse";

describe("mouse", () => {
  test("calls the updatePosition method on mousemove", () => {
    const spy = jest.spyOn(mouse, "updatePosition");

    window.dispatchEvent(new Event("mousemove"));

    // Take out of the event loop so runs after event is triggered
    setTimeout(() => {
      expect(spy).toHaveBeenCalled();
    }, 0);
  });
});
