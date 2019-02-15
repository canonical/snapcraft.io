import lightbox from "./../../publisher/market/lightbox";
import { isMobile } from "../../libs/mobile";
import { Swiper, Navigation } from "swiper/dist/js/swiper.esm";
import { SCREENSHOTS_CONFIG } from "../../config/swiper.config";
import iframeSize from "../../libs/iframeSize";

Swiper.use([Navigation]);

let screenshotsEl;

function clickCallback(event) {
  const url = event.target.dataset.original;
  const images = filterImages();

  if (url) {
    if (isMobile()) {
      window.open(url, "_blank");
      window.focus();
    } else {
      lightbox.openLightbox(url, images);
    }
  }
}

function filterImages() {
  return Array.from(
    screenshotsEl.querySelectorAll("img, video, .js-video-slide")
  )
    .filter(image => image.dataset.original)
    .map(image => image.dataset.original);
}

function initScreenshots(screenshotsId) {
  screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.addEventListener("click", clickCallback);

  const config = Object.assign(SCREENSHOTS_CONFIG, {
    // This hack is to fix a reported Swiper issue in firefox
    // https://github.com/nolimits4web/swiper/issues/2218
    // Hack https://github.com/nolimits4web/swiper/issues/2218#issuecomment-388837042
    // TODO: When the issue linked above is fixed, remove this
    on: {
      init() {
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 200);
      }
    }
  });

  // We need to resize the iframe on window resize
  iframeSize(".js-video-slide");

  new Swiper(screenshotsEl.querySelector(".swiper-container"), config);
}

function terminateScreenshots(screenshotsId) {
  screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.removeEventListener("click", clickCallback);
}

export { initScreenshots as default, terminateScreenshots };
