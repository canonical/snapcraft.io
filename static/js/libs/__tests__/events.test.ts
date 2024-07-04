import "@testing-library/jest-dom";

import Events from "../events";

const events = new Events();
const button = document.createElement("button");
button.classList.add("test-button");

describe("Events", () => {
  test("adds an event listener", () => {
    const testEvent = jest.fn();
    events.addEvent("click", button, testEvent);
    button.click();
    expect(testEvent).toHaveBeenCalled();
  });

  test("adds events by type", () => {
    const testEvent = jest.fn();
    events.addEvents({
      click: {
        "[class=test-button]": (event: { preventDefault: () => void }) => {
          event.preventDefault();
          testEvent();
        },
      },
    });
    button.click();
    expect(testEvent).toHaveBeenCalled();
  });
});
