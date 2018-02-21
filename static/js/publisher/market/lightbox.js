function openLightbox(url, images) {
  const lightboxEl = initLightboxEl(images);

  openLightboxEl(lightboxEl, url, images);
}

const lightboxTpl = `
  <div class="vbox-preloader">Loading...</div>
  <div class="vbox-container">
    <div class="vbox-content">
      <img class="figlio" >
    </div>
  </div>

  <div class="vbox-title" style="display: none;"></div>
  <div class="vbox-num" style="display: none;">0/0</div>
  <div class="vbox-close">X</div>
  <button class="vbox-next">next</button>
  <button class="vbox-prev">prev</button>
`;

const initLightboxEl = () => {
  const lightboxEl = document.createElement('div');
  lightboxEl.className = 'vbox-overlay';
  lightboxEl.style.display = 'none';
  lightboxEl.style.display = '0';
  lightboxEl.innerHTML = lightboxTpl;

  // adjust positioning when image loads
  const contentEl = lightboxEl.querySelector('.vbox-content');
  const lightboxImgEl = lightboxEl.querySelector('.vbox-content img');

  lightboxImgEl.addEventListener('load', () => {
    contentEl.style.opacity = "1";
  });

  const closeLightbox = (event) => {
    event.preventDefault();
    closeLightboxEl(lightboxEl);
  };

  lightboxEl.querySelector('.vbox-close').addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('click', (event) => {
    const ignore = [
      'figlio',
      'vbox-next',
      'vbox-prev'
    ];
    // This assumes a single class on each item
    if (ignore.indexOf(event.target.className) < 0){
      closeLightbox(event);
    }
  });

  return lightboxEl;
};

const loadLightboxImage = (lightboxEl, url, images) => {
  // hide content before it loads
  lightboxEl.querySelector('.vbox-content').style.opacity = "0";

  // load image
  lightboxEl.querySelector('.vbox-content img').src = url;

  // update prev/next buttons
  if (images && images.length) {
    const imageIndex = images.indexOf(url);

    if (imageIndex > 0) {
      lightboxEl.querySelector('.vbox-prev').removeAttribute('disabled');
      lightboxEl.querySelector('.vbox-prev').dataset.url = images[imageIndex - 1];
    } else {
      lightboxEl.querySelector('.vbox-prev').setAttribute('disabled', 'disabled');
      lightboxEl.querySelector('.vbox-prev').dataset.url = null;
    }

    if (imageIndex < images.length-1) {
      lightboxEl.querySelector('.vbox-next').removeAttribute('disabled');
      lightboxEl.querySelector('.vbox-next').dataset.url = images[imageIndex + 1];
    } else {
      lightboxEl.querySelector('.vbox-next').setAttribute('disabled', 'disabled');
      lightboxEl.querySelector('.vbox-next').dataset.url = null;
    }
  }
};

const openLightboxEl = (lightboxEl, url, images) => {
  // prepare navigating to next/prev images
  if (images && images.length) {
    const handleNextPrevClick = (event) => {
      event.preventDefault();
      if (event.target.dataset.url) {
        loadLightboxImage(lightboxEl, event.target.dataset.url, images);
      }
    };

    const handleNextPrevKey = (event) => {
      const KEYS = {
        ESC: 27,
        LEFT: 37,
        RIGHT: 39
      };
      let image;
      switch(event.keyCode) {
        case KEYS.ESC:
          closeLightboxEl(lightboxEl);
          break;
        case KEYS.LEFT:
          image = lightboxEl.querySelector('.vbox-prev').dataset.url;
          if (image !== 'null') {
            loadLightboxImage(
              lightboxEl,
              image,
              images
            );
          }
          break;
        case KEYS.RIGHT:
          image = lightboxEl.querySelector('.vbox-next').dataset.url;
          if (image !== 'null') {
            loadLightboxImage(
              lightboxEl,
              image,
              images
            );
          }
          break;
      }
    };

    lightboxEl.querySelector('.vbox-next').addEventListener('click', handleNextPrevClick);
    lightboxEl.querySelector('.vbox-prev').addEventListener('click', handleNextPrevClick);
    window.addEventListener('keyup', handleNextPrevKey);
  }

  // open lightbox
  document.body.classList.add('vbox-open');
  document.body.appendChild(lightboxEl);
  lightboxEl.style.opacity = '1';
  lightboxEl.style.display = 'block';

  // load image
  loadLightboxImage(lightboxEl, url, images);
};

const closeLightboxEl = (lightboxEl) => {
  lightboxEl.style.opacity = '0';
  lightboxEl.style.display = 'none';
  if (lightboxEl.parentNode) {
    lightboxEl.parentNode.removeChild(lightboxEl);
  }
  document.body.classList.remove('vbox-open');
};

const lightbox = {
  openLightbox
};

export default lightbox;
