import lightbox from "./../../publisher/market/lightbox";
import { isMobile } from "../../libs/mobile";
import { Swiper, Navigation } from "swiper/dist/js/swiper.esm";
import { SCREENSHOTS_CONFIG } from "../../config/swiper.config";
import debounce from "../../libs/debounce";

Swiper.use([Navigation]);

const IFRAME_RATIO = 643 / 362;

function sizeIframe() {
  const iframe = document.querySelector(".js-video-slide iframe");

  if (iframe) {
    const width = iframe.clientWidth;
    iframe.height = width / IFRAME_RATIO;
  }
}

export default function initScreenshots(screenshotsId) {
  const screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  const images = Array.from(
    screenshotsEl.querySelectorAll("img, video, .js-video-slide")
  )
    .filter(image => image.dataset.original)
    .map(image => image.dataset.original);

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

  window.addEventListener("resize", debounce(sizeIframe, 100));

  sizeIframe();

  new Swiper(screenshotsEl.querySelector(".swiper-container"), config);
}
