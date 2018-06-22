import lightbox from './../../publisher/market/lightbox';
import { isMobile } from '../../libs/mobile';

export default function initScreenshots(screenshotsId) {
  const screenshotsEl = document.querySelector(screenshotsId);

  if (!screenshotsEl) {
    return;
  }

  const images = Array.from(screenshotsEl.querySelectorAll('img')).map(image => image.src);

  screenshotsEl.addEventListener('click', (event) => {
    const url = event.target.src;

    if (url) {
      if (isMobile()) {
        window.open(url, '_blank');
        window.focus();
      } else {
        lightbox.openLightbox(url, images);
      }
    }
  });

  // wrap screenshots in additional container to allow changing position
  // inside of overflow hidden container
  const wrapper = screenshotsEl.querySelector('.p-screenshots__wrapper');
  const container = document.createElement('div');
  container.className = 'p-screenshots__container';
  screenshotsEl.appendChild(container);
  container.appendChild(wrapper);

  // add buttons to change position of screenshots
  const next = document.createElement('button');
  next.className = 'p-screenshots__next';
  next.innerHTML = 'next';

  const prev = document.createElement('button');
  prev.className = 'p-screenshots__prev';
  prev.innerHTML = 'previous';

  screenshotsEl.appendChild(prev);
  screenshotsEl.appendChild(next);


  // get table of offsets for all screenshots
  let offsets = Array.from(screenshotsEl.querySelectorAll('.p-screenshot'))
    .map(screenshot => screenshot.offsetLeft);

  let current = 0;

  function setCurrent(n) {
    // update offsets in case images finished loading after init
    offsets = Array.from(screenshotsEl.querySelectorAll('.p-screenshot'))
      .map(screenshot => screenshot.offsetLeft);

    current = n;
    wrapper.style.left = `-${offsets[n]}px`;

    // update buttons based on current screenshot
    if (current === 0) {
      prev.disabled = 'disabled';
    } else {
      prev.disabled = false;
    }

    if (current === offsets.length - 1) {
      next.disabled = 'disabled';
    } else {
      next.disabled = false;
    }
  }

  setCurrent(0);

  next.addEventListener('click', (event) => {
    event.preventDefault();
    if (current < offsets.length-1) {
      setCurrent(current+1);
    }
  });
  prev.addEventListener('click', (event) => {
    event.preventDefault();
    if (current > 0) {
      setCurrent(current-1);
    }
  });
}
