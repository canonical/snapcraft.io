import "@testing-library/jest-dom";
import iframeSize from "../iframeSize";

describe("iframeSize", () => {
  test("sizes iframe to container width and maintain ratio", () => {
    const frameWrapper = document.createElement("div");
    const frame = document.createElement("iframe");

    frame.width = "100";
    frame.height = "50";

    frameWrapper.classList.add("frame-wrapper");
    frameWrapper.appendChild(frame);

    document.body.appendChild(frameWrapper);

    frameWrapper.getBoundingClientRect = jest.fn(() => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 500,
      height: 500,
    })) as any;

    iframeSize(".frame-wrapper");

    expect(frame.getAttribute("width")).toBe("500");
    expect(frame.getAttribute("height")).toBe("250");
  });
});
