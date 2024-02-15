import lightbox from "./../../publisher/market/lightbox";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import { SCREENSHOTS_CONFIG } from "../../config/swiper.config";
import iframeSize from "../../libs/iframeSize";

Swiper.use([Navigation]);

let screenshotsEl;

function clickCallback(event) {
  const url = event.target.dataset.original;
  const images = filterImages();

  if (url) {
    lightbox.openLightbox(url, images);
  }
}

function filterImages() {
  return Array.from(
    screenshotsEl.querySelectorAll("img, video, .js-video-slide"),
  )
    .filter((image) => image.dataset.original)
    .map((image) => image.dataset.original);
}

function initScreenshots(screenshotsId) {
  screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.addEventListener("click", clickCallback);

  // We need to resize the iframe on window resize
  iframeSize(".js-video-slide");

  const swipeContainer = screenshotsEl.querySelector(".swiper-container");

  if (swipeContainer) {
    new Swiper(swipeContainer, SCREENSHOTS_CONFIG);
  }
}

function terminateScreenshots(screenshotsId) {
  screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.removeEventListener("click", clickCallback);
}

export { initScreenshots as default, terminateScreenshots };
