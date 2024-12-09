import { useState } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { Button, Icon } from "@canonical/react-components";

import TourStep from "./TourStep";

type Props = {
  steps: {
    target: string;
    title: string;
    content: JSX.Element;
    disableBeacon?: boolean;
  }[];
};
function Tour({ steps }: Props) {
  const firstVisit = !localStorage.getItem("tourSeen");
  const [run, setRun] = useState<boolean>(firstVisit);

  const handleClickStart = () => {
    setRun(true);
  };

  if (firstVisit) {
    localStorage.setItem("tourSeen", "true");
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;

    if (action === "close") {
      setRun(false);
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };
  return (
    <>
      <Button
        type="button"
        onClick={handleClickStart}
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "2rem",
          zIndex: 100,
        }}
      >
        <Icon name="question" />
        <span className="u-off-screen">Start tour</span>
      </Button>
      <Joyride
        run={run}
        callback={handleJoyrideCallback}
        tooltipComponent={TourStep}
        continuous={true}
        disableCloseOnEsc={true}
        disableOverlayClose={true}
        scrollOffset={80}
        showProgress={true}
        steps={steps}
      />
    </>
  );
}

export default Tour;
