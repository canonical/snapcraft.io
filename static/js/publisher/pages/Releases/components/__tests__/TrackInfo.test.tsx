import { render, screen } from "@testing-library/react";
import TrackInfo from "../TrackInfo";
import "@testing-library/jest-dom";

describe("TrackInfo", () => {
  it("should render null when both versionPattern and automaticPhasingPercentage are null", () => {
    const { container } = render(
      <TrackInfo versionPattern={null} automaticPhasingPercentage={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render version pattern when only versionPattern is provided", () => {
    render(
      <TrackInfo versionPattern="v1.*" automaticPhasingPercentage={null} />,
    );
    expect(screen.getByText("Version pattern: v1.*")).toBeInTheDocument();
  });

  it("should render automatic phasing percentage when only automaticPhasingPercentage is provided", () => {
    render(<TrackInfo versionPattern={null} automaticPhasingPercentage="88" />);
    expect(screen.getByText("Auto. phasing %: 88")).toBeInTheDocument();
  });

  it("should render both version pattern and automatic phasing percentage when both are provided", () => {
    render(<TrackInfo versionPattern="v1.*" automaticPhasingPercentage="88" />);
    expect(
      screen.getByText("Version pattern: v1.* / Auto. phasing %: 88"),
    ).toBeInTheDocument();
  });

  it("should display the tooltip", () => {
    render(<TrackInfo versionPattern="v1.*" automaticPhasingPercentage="88" />);

    // Tooltip message is always portaled into the DOM, just hidden until hover/focus.
    expect(
      screen.getByText(
        /The version pattern and the automatic phasing percentage are additional/,
      ),
    ).toBeInTheDocument();
  });
});
