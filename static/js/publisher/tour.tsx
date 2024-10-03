import { createRoot } from "react-dom/client";

import Tour from "./tour/tour";

import { toggleShadowWhenSticky } from "./market/stickyListingBar";

import type { TourStep } from "../publisher-pages/types";

// returns true if % of truthy values in the array is above the threshold
function isCompleted(fields: unknown[], threshold = 0.5): boolean {
  const completed = fields.filter((isCompleted) => isCompleted);

  return completed.length / fields.length >= threshold;
}

export function initTour({
  container,
  steps,
  onTourStarted,
  onTourClosed,
  startTour,
}: {
  container: HTMLElement;
  steps: TourStep[];
  onTourStarted: () => void;
  onTourClosed: () => void;
  startTour: boolean;
}) {
  if (!document.contains(container)) {
    throw Error("initTour container element not found in document.");
  }
  if (!steps || !steps.length) {
    throw Error("initTour expects steps array as an argument.");
  }

  const root = createRoot(container);
  root.render(
    <Tour
      steps={steps}
      onTourStarted={onTourStarted}
      onTourClosed={onTourClosed}
      startTour={startTour}
    />,
  );
}

export function initListingTour({
  snapName,
  container,
  steps,
  formFields,
}: {
  snapName: string;
  container: HTMLElement;
  steps: TourStep[];
  formFields: {
    title: string;
    snap_name: string;
    categories: string[];
    video_urls: string[];
    images: Array<{
      type: string;
    }>;
    summary: string;
    website: string[];
    contact: string[];
  };
}) {
  const storageKey = `listing-tour-finished-${snapName}`;

  // check form fields completed status
  // truthy value means field is considered completed
  const completedFields = [
    // title is completed if it is different from package name
    formFields.title !== formFields.snap_name,
    // category
    formFields.categories.length,
    // video
    formFields.video_urls.length,
    // icon
    formFields.images.filter((i) => i.type === "icon").length,
    // images
    formFields.images.filter((i) => i.type === "screenshot").length,
    // banner
    formFields.images.filter((i) => i.type === "banner").length,
    // summary is completed if it is different from the title
    formFields.summary !== formFields.title,
    // if one of website or contact is filled we consider it completed
    formFields.website || formFields.contact,
  ];

  const isFormCompleted = isCompleted(completedFields);
  const isTourFinished = !!(
    window.localStorage && window.localStorage.getItem(storageKey) === "true"
  );

  // start the tour automatically if form is not completed
  // (has less than 50% fields filled), and the tour wasn't closed before
  const startTour = !isFormCompleted && !isTourFinished;

  const stickyHeader = document.querySelector(".js-sticky-bar");
  const onTourClosed = (): void => {
    // save that tour was seen by user
    window.localStorage && window.localStorage.setItem(storageKey, "true");
    // make header sticky again
    if (stickyHeader) {
      stickyHeader.classList.remove("is-static");
    }
    toggleShadowWhenSticky(stickyHeader);
  };

  const onTourStarted = (): void => {
    if (stickyHeader) {
      stickyHeader.classList.add("is-static");
    }
  };

  initTour({ container, steps, onTourStarted, onTourClosed, startTour });
}
