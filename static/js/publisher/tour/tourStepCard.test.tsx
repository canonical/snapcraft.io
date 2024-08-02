import { render, fireEvent, cleanup } from "@testing-library/react";

import TourStepCard from "./tourStepCard";

// Helper function to be used in testing library queries,
// to query elements by text content even if the text is
// contained in child elements
//
// For example to query for a button with icon:
// <button><i>Text</i></button>
//
// getByText(textContentEquals("Text"), { selector: "button" })
const textContentEquals = (textContent: string) => {
  return (_: unknown, node: HTMLElement): boolean =>
    node.textContent === textContent;
};

describe("TourStepCard", () => {
  const dummyStep = {
    id: "test-step",
    position: "bottom-left",
    title: "Test step title",
    content: "Test step content",
    elements: [],
  };

  const dummyMask = {
    top: 10,
    bottom: 20,
    left: 30,
    right: 40,
  };

  let onFinishClick: () => void;
  let onSkipClick: () => void;
  let onNextClick: () => void;
  let onPrevClick: () => void;

  beforeEach(() => {
    onFinishClick = jest.fn();
    onSkipClick = jest.fn();
    onNextClick = jest.fn();
    onPrevClick = jest.fn();
  });

  afterEach(cleanup);

  const renderTourStepCard = (steps = [dummyStep], currentStepIndex = 0) => {
    return render(
      <TourStepCard
        mask={dummyMask}
        steps={steps}
        currentStepIndex={currentStepIndex}
        onFinishClick={onFinishClick}
        onSkipClick={onSkipClick}
        onNextClick={onNextClick}
        onPrevClick={onPrevClick}
      />
    );
  };

  it("should render tour step", () => {
    const { getByText } = renderTourStepCard();

    expect(getByText(dummyStep.title)).toBeDefined();
    expect(getByText(dummyStep.content)).toBeDefined();
  });

  describe("when showing first step", () => {
    const steps = [
      {
        ...dummyStep,
        id: "test-step-first",
        position: "bottom-right",
      },
      dummyStep,
    ];

    it("should not show Finish button", () => {
      const { queryByText } = renderTourStepCard(steps);

      expect(queryByText("Finish tour")).toBeNull();
    });

    it("should show disabled Previous button", () => {
      const { getByText } = renderTourStepCard(steps);
      // @ts-expect-error
      const prevButton = getByText(textContentEquals("Previous step"), {
        selector: "button",
      });

      // @ts-expect-error
      expect(prevButton.disabled).toBe(true);
    });

    it("clicking on Skip link should trigger skip callback", () => {
      const { getByText } = renderTourStepCard(steps);

      fireEvent.click(getByText("Skip tour"));

      expect(onSkipClick).toHaveBeenCalled();
    });

    it("clicking on Next button should trigger next callback", () => {
      const { getByText } = renderTourStepCard(steps);

      fireEvent.click(getByText("Next step"));

      expect(onNextClick).toHaveBeenCalled();
    });
  });

  describe("when showing middle step", () => {
    const steps = [
      dummyStep,
      {
        ...dummyStep,
        id: "test-step-middle",
        position: "top-left",
      },
      {
        ...dummyStep,
        id: "test-step-last",
      },
    ];

    it("should not show Finish button", () => {
      const { queryByText } = renderTourStepCard(steps, 1);

      expect(queryByText("Finish tour")).toBeNull();
    });

    it("clicking on Skip link should trigger skip callback", () => {
      const { getByText } = renderTourStepCard(steps, 1);

      fireEvent.click(getByText("Skip tour"));

      expect(onSkipClick).toHaveBeenCalled();
    });

    it("clicking on Previous button should trigger previous callback", () => {
      const { getByText } = renderTourStepCard(steps, 1);

      fireEvent.click(getByText("Previous step"));

      expect(onPrevClick).toHaveBeenCalled();
    });

    it("clicking on Next button should trigger next callback", () => {
      const { getByText } = renderTourStepCard(steps);

      fireEvent.click(getByText("Next step"));

      expect(onNextClick).toHaveBeenCalled();
    });
  });

  describe("when showing last step", () => {
    const steps = [
      dummyStep,
      {
        id: "test-step-last",
        position: "top-right",
        title: "",
        elements: [],
        content: "",
      },
    ];

    it("should not show skip tour link", () => {
      const { queryByText } = renderTourStepCard(steps, 1);

      expect(queryByText("Skip tour")).toBeNull();
    });

    it("should not show Next button", () => {
      const { queryByText } = renderTourStepCard(steps, 1);

      expect(queryByText("Next step")).toBeNull();
    });

    it("clicking on Finish button should trigger finish callback", () => {
      const { getByText } = renderTourStepCard(steps, 1);

      fireEvent.click(getByText("Finish tour"));

      expect(onFinishClick).toHaveBeenCalled();
    });
  });
});
