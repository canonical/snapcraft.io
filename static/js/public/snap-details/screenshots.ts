import lightbox from "./../../publisher/market/lightbox";
import Swiper from "swiper";
import { Navigation } from "swiper/modules";
import { SCREENSHOTS_CONFIG } from "../../config/swiper.config";
import iframeSize from "../../libs/iframeSize";
import debounce from "../../libs/debounce";

Swiper.use([Navigation]);

let screenshotsEl: HTMLElement;

function clickCallback(event: Event): void {
  const target = event.target as HTMLElement;
  const url = target.dataset.original;
  const images = filterImages();

  if (url) {
    lightbox.openLightbox(url, images);
  }
}

function filterImages(): (string | undefined)[] {
  const screenshotsEls = screenshotsEl.querySelectorAll(
    "img, video, .js-video-slide"
  ) as NodeListOf<HTMLElement>;

  return Array.from(screenshotsEls)
    .filter((image) => image.dataset.original)
    .map((image) => image.dataset.original);
}

function initScreenshots(this: unknown, screenshotsId: string) {
  screenshotsEl = document.querySelector(screenshotsId) as HTMLElement;

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.addEventListener("click", clickCallback);

  // We need to resize the iframe on window resize
  window.addEventListener(
    "resize",
    debounce(iframeSize.bind(this, ".js-video-slide"), 100)
  );

  iframeSize(".js-video-slide");

  const swipeContainer = screenshotsEl.querySelector(
    ".swiper-container"
  ) as HTMLElement;

  if (swipeContainer) {
    new Swiper(swipeContainer, SCREENSHOTS_CONFIG);
  }
}

function terminateScreenshots(screenshotsId: string) {
  screenshotsEl = document.querySelector(screenshotsId) as HTMLElement;

  if (!screenshotsEl) {
    return;
  }

  screenshotsEl.removeEventListener("click", clickCallback);
}

export { initScreenshots as default, terminateScreenshots };
