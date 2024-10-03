import { useState, useEffect, ReactNode } from "react";

import TourOverlay from "./tourOverlay";
import TourBar from "./tourBar";

import { tourStartedAutomatically } from "./metricsEvents";

import type { TourStep } from "../../publisher-pages/types";

type Props = {
  steps: TourStep[];
  startTour: boolean;
  onTourStarted: () => void;
  onTourClosed: () => void;
};

export default function Tour({
  steps,
  onTourStarted,
  onTourClosed,
  startTour = false,
}: Props): ReactNode {
  // send metrics event if tour started automatically
  useEffect(() => {
    if (startTour) {
      tourStartedAutomatically();
    }
  }, [startTour]);

  const [isTourOpen, setIsTourOpen] = useState(startTour);

  const showTour = () => setIsTourOpen(true);
  const hideTour = () => setIsTourOpen(false);

  // trigger callbacks when tour is started or finished
  useEffect(() => {
    if (isTourOpen && onTourStarted) {
      onTourStarted();
    }
    if (!isTourOpen && onTourClosed) {
      onTourClosed();
    }
  }, [isTourOpen]);

  return (
    <>
      <TourBar showTour={showTour} />

      {isTourOpen && <TourOverlay steps={steps} hideTour={hideTour} />}
    </>
  );
}
