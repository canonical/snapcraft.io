import { tourStartedByUser } from "./metricsEvents";

export default function TourBar({ showTour }: { showTour: () => void }) {
  const onButtonClick = () => {
    tourStartedByUser();
    showTour();
  };

  return (
    <div className="p-tour-bar">
      <div className="u-fixed-width u-clearfix">
        <button
          className="p-tour-bar__button"
          data-tour="tour-end"
          onClick={onButtonClick}
        >
          <i className="p-icon--question">Tour</i>
        </button>
      </div>
    </div>
  );
}
