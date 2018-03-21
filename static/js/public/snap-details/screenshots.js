import lightbox from './../../publisher/market/lightbox';

export default function initScreenshots(screenshotsId) {
  const screenshotsEl = document.querySelector(screenshotsId);

  const images = Array.from(screenshotsEl.querySelectorAll('img')).map(image => image.src);

  screenshotsEl.addEventListener('click', (event) => {
    const url = event.target.src;

    if (url) {
      lightbox.openLightbox(url, images);
    }
  });

  screenshotsEl.classList.add('js-ready');
}
