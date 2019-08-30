import React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";

import Tour from "./tour";

// mocks
import { tourStartedAutomatically } from "./metricsEvents";
jest.mock("./metricsEvents");

import TourOverlay from "./tourOverlay";
jest.mock("./tourOverlay", () => jest.fn().mockReturnValue(null));

describe("Tour", () => {
  const steps = [
    {
      id: "test-step"
    }
  ];

  afterEach(cleanup);

  it("should render TourBar with a button", () => {
    const { getByText } = render(<Tour steps={steps} />);

    const button = getByText("Tour");
    expect(button).toBeDefined();

    expect(TourOverlay).not.toBeCalled();
  });

  describe("when tour button is clicked", () => {
    it("should render tour overlay", () => {
      const { getByText } = render(<Tour steps={steps} />);
      const button = getByText("Tour");

      fireEvent.click(button);

      expect(TourOverlay).toBeCalledWith(
        expect.objectContaining({
          steps
        }),
        expect.any(Object)
      );
    });
  });

  describe("when startTour is true", () => {
    it("should render tour overlay", () => {
      render(<Tour steps={steps} startTour={true} />);

      expect(TourOverlay).toBeCalledWith(
        expect.objectContaining({
          steps
        }),
        expect.any(Object)
      );
    });

    it("should call metrics event", () => {
      render(<Tour steps={steps} startTour={true} />);
      expect(tourStartedAutomatically).toBeCalled();
    });
  });

  describe("when tour start callback is provided", () => {
    let onTourStarted;

    beforeEach(() => {
      onTourStarted = jest.fn();
    });

    it("should call the callback when starting automatically", () => {
      render(
        <Tour steps={steps} startTour={true} onTourStarted={onTourStarted} />
      );

      expect(onTourStarted).toBeCalled();
    });

    it("should call the callback when starting with a button", () => {
      const { getByText } = render(
        <Tour steps={steps} onTourStarted={onTourStarted} />
      );
      fireEvent.click(getByText("Tour"));

      expect(onTourStarted).toBeCalled();
    });
  });

  describe("when tour close callback is provided", () => {
    let onTourClosed;

    beforeEach(() => {
      onTourClosed = jest.fn();
    });

    it("should not call the callback when starting automatically", () => {
      render(
        <Tour steps={steps} startTour={true} onTourClosed={onTourClosed} />
      );

      expect(onTourClosed).not.toBeCalled();
    });

    it("should call the callback when rendered initially", () => {
      render(<Tour steps={steps} onTourClosed={onTourClosed} />);

      expect(onTourClosed).toBeCalled();
    });
  });
});
