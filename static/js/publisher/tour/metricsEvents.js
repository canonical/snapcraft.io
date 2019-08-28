import { triggerEvent } from "../../base/ga";

export const tourStartedByUser = () =>
  triggerEvent(
    "tour-started-by-user",
    window.location.href,
    "",
    `Tour started manually by user on "${document.title}" page`
  );

export const tourStartedAutomatically = () =>
  triggerEvent(
    "tour-started-automatically",
    window.location.href,
    "",
    `Tour started automatically on "${document.title}" page`
  );

export const tourFinished = stepId =>
  triggerEvent(
    "tour-finished",
    window.location.href,
    "",
    `Tour finished on "${document.title}" page on step ${stepId}`
  );

export const tourSkipped = stepId =>
  triggerEvent(
    "tour-skipped",
    window.location.href,
    "",
    `Tour skipped on "${document.title}" page on step ${stepId}`
  );
