import "@testing-library/jest-dom";
import mouse from "../mouse";

describe("mouse", () => {
  test("calls the updatePosition method on mousemove", () => {
    window.dispatchEvent(
      new MouseEvent("mousemove", { clientX: 1, clientY: 1 }),
    );

    // Take out of the event loop so runs after event is triggered
    setTimeout(() => {
      expect(mouse.position).toMatchObject({ x: 1, y: 1 });
    }, 0);
  });
});
