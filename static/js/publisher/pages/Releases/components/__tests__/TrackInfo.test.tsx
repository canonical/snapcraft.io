import { fireEvent, render, screen } from "@testing-library/react";
import TrackInfo from "../TrackInfo";
import { Tooltip } from "@canonical/react-components";
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
    const tooltipIcon = document.querySelector(".p-icon--information");
    expect(tooltipIcon).toBeInTheDocument();

    render(
      <Tooltip
        autoAdjust
        message={`The version pattern and the automatic phasing percentage are additional
properties available as options when creating a new track.
Releases will be done progressively on the track and 88% will be incremented automatically.`}
        children={undefined}
      />,
    );

    fireEvent.click(tooltipIcon!);

    expect(
      screen.getByText(
        /The version pattern and the automatic phasing percentage are additional/,
      ),
    ).toBeInTheDocument();
  });
});
