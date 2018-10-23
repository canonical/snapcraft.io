import lightbox from "./../../publisher/market/lightbox";
import { isMobile } from "../../libs/mobile";
import { Swiper, Navigation } from "swiper/dist/js/swiper.esm";
import { SCREENSHOTS_CONFIG } from "../../config/swiper.config";

Swiper.use([Navigation]);

export default function initScreenshots(screenshotsId) {
  const screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  const images = Array.from(screenshotsEl.querySelectorAll("img")).map(
    image => image.dataset.original
  );

  screenshotsEl.addEventListener("click", event => {
    const url = event.target.dataset.original;

    if (url) {
      if (isMobile()) {
        window.open(url, "_blank");
        window.focus();
      } else {
        lightbox.openLightbox(url, images);
      }
    }
  });

  new Swiper(
    screenshotsEl.querySelector(".swiper-container"),
    SCREENSHOTS_CONFIG
  );
}
