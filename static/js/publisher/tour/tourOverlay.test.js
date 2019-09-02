import React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";

import TourOverlay from "./tourOverlay";

// mocks
jest.mock("./constants"); // __mocks__/constants.js
jest.mock("./helpers");
jest.mock("./metricsEvents");
jest.mock("../../public/scroll-to");

import {
  prepareSteps,
  isVisibleInDocument,
  getMaskFromElements
} from "./helpers";
import { tourSkipped, tourFinished } from "./metricsEvents";
import { animateScrollTo } from "../../public/scroll-to";

isVisibleInDocument.mockReturnValue(true);

getMaskFromElements.mockReturnValue({
  top: 10,
  left: 20,
  bottom: 30,
  right: 40
});

prepareSteps.mockImplementation(steps => steps);

describe("TourOverlay", () => {
  const steps = [
    {
      id: "test-step-1",
      title: "Test step 1",
      position: "bottom-left"
    },
    {
      id: "test-step-2",
      title: "Test step 2",
      position: "top-left"
    }
  ];

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it("should render TourStepCard for first step", () => {
    const { getByText } = render(<TourOverlay steps={steps} />);

    expect(getByText(steps[0].title)).toBeDefined();
  });

  describe("when moving to next step", () => {
    it("should render TourStepCard for next step", () => {
      const { getByText } = render(<TourOverlay steps={steps} />);

      fireEvent.click(getByText("Next step"));

      expect(getByText(steps[1].title)).toBeDefined();
    });

    it("should scroll next step into view", () => {
      const { getByText } = render(<TourOverlay steps={steps} />);

      fireEvent.click(getByText("Next step"));

      expect(animateScrollTo).toHaveBeenCalled();
    });
  });

  describe("when moving to previous step", () => {
    it("should render TourStepCard for previous step", () => {
      const { getByText } = render(
        <TourOverlay steps={steps} currentStepIndex={1} />
      );

      fireEvent.click(getByText("Previous step"));

      expect(getByText(steps[0].title)).toBeDefined();
    });

    it("should scroll previous step into view", () => {
      const { getByText } = render(
        <TourOverlay steps={steps} currentStepIndex={1} />
      );

      fireEvent.click(getByText("Previous step"));

      expect(animateScrollTo).toHaveBeenCalled();
    });
  });

  describe("when skipping the tour", () => {
    it("should call the hide callback", () => {
      const hideTour = jest.fn();

      const { getByText } = render(
        <TourOverlay steps={steps} hideTour={hideTour} />
      );

      fireEvent.click(getByText("Skip tour"));

      expect(hideTour).toHaveBeenCalled();
    });

    it("should trigger the skip metrics event", () => {
      const hideTour = jest.fn();

      const { getByText } = render(
        <TourOverlay steps={steps} hideTour={hideTour} />
      );

      fireEvent.click(getByText("Skip tour"));

      expect(tourSkipped).toHaveBeenCalled();
      expect(tourFinished).not.toHaveBeenCalled();
    });
  });

  describe("when finishing the tour", () => {
    it("should call the hide callback", () => {
      const hideTour = jest.fn();

      const { getByText } = render(
        <TourOverlay steps={steps} currentStepIndex={1} hideTour={hideTour} />
      );

      fireEvent.click(getByText("Finish tour"));

      expect(hideTour).toHaveBeenCalled();
    });

    it("should trigger the finished metrics event", () => {
      const hideTour = jest.fn();

      const { getByText } = render(
        <TourOverlay steps={steps} currentStepIndex={1} hideTour={hideTour} />
      );

      fireEvent.click(getByText("Finish tour"));

      expect(tourSkipped).not.toHaveBeenCalled();
      expect(tourFinished).toHaveBeenCalled();
    });
  });

  describe("when closing tour with ESC key", () => {
    it("should call the hide callback", () => {
      const hideTour = jest.fn();

      render(<TourOverlay steps={steps} hideTour={hideTour} />);

      fireEvent.keyUp(document, { key: "Escape", keyCode: 27 });

      expect(hideTour).toHaveBeenCalled();
    });

    it("should trigger the skip metrics event", () => {
      const hideTour = jest.fn();

      render(<TourOverlay steps={steps} hideTour={hideTour} />);

      fireEvent.keyUp(document, { key: "Escape", keyCode: 27 });

      expect(tourSkipped).toHaveBeenCalled();
      expect(tourFinished).not.toHaveBeenCalled();
    });

    it("should trigger the finish metrics event on last step", () => {
      const hideTour = jest.fn();

      render(
        <TourOverlay steps={steps} currentStepIndex={1} hideTour={hideTour} />
      );

      fireEvent.keyUp(document, { key: "Escape", keyCode: 27 });

      expect(tourSkipped).not.toHaveBeenCalled();
      expect(tourFinished).toHaveBeenCalled();
    });
  });
});
