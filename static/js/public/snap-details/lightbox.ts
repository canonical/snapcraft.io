function openLightbox(url: string, images: (string | undefined)[]) {
  const lightboxEl = initLightboxEl();

  openLightboxEl(lightboxEl, url, images);
}

const lightboxTpl = `
  <div class="vbox-preloader">Loading...</div>
  <div class="vbox-container">
    <div class="vbox-content">
    </div>
  </div>

  <div class="vbox-title" style="display: none;"></div>
  <div class="vbox-num" style="display: none;">0/0</div>
  <div class="vbox-close">X</div>
  <button class="vbox-next">next</button>
  <button class="vbox-prev">prev</button>
`;

const initLightboxEl = () => {
  let lightboxEl = document.querySelector(".vbox-overlay") as HTMLElement;
  if (!lightboxEl) {
    lightboxEl = document.createElement("div");
    lightboxEl.className = "vbox-overlay";
  }

  lightboxEl.style.display = "none";
  lightboxEl.style.display = "0";
  lightboxEl.innerHTML = lightboxTpl;

  const closeLightbox = (event: Event) => {
    event.preventDefault();
    closeLightboxEl(lightboxEl);
  };

  const closeButton = lightboxEl.querySelector(".vbox-close");

  if (closeButton) {
    closeButton.addEventListener("click", closeLightbox);
  }

  lightboxEl.addEventListener("click", (event) => {
    const ignore = ["figlio", "vbox-next", "vbox-prev"];
    // This assumes a single class on each item
    const target = event.target as HTMLElement;

    if (!target) {
      return;
    }

    if (ignore.indexOf(target.className) < 0) {
      closeLightbox(event);
    }
  });

  return lightboxEl;
};

const loadLightboxImage = (
  lightboxEl: HTMLElement,
  url: string | undefined,
  images: (string | undefined)[],
) => {
  const contentEl = lightboxEl.querySelector(".vbox-content") as HTMLElement;

  if (contentEl) {
    // hide content before it loads
    contentEl.style.opacity = "0";
    const currentMedia = contentEl.querySelector(".figlio");
    if (currentMedia) {
      contentEl.removeChild(currentMedia);
    }
  }

  let media;
  // load media
  if (url && url.includes(".gif")) {
    try {
      media = document.createElement("video");
      media.autoplay = true;
      media.loop = true;
      media.classList.add("figlio");
      contentEl.appendChild(media);
      contentEl.style.opacity = "1";

      const originalEl = document.body.querySelector(
        `[data-original="${url}"]`,
      );

      if (originalEl) {
        const webm = originalEl.querySelector(
          "[type='video/webm']",
        ) as HTMLMediaElement;
        const mp4 = originalEl.querySelector(
          "[type='video/mp4']",
        ) as HTMLMediaElement;

        if (media.canPlayType("video/webm") && webm) {
          media.src = webm.src;
        } else if (media.canPlayType("video/mp4") && mp4) {
          media.src = mp4.src;
        }
      }
    } catch (_) {
      if (media && media.parentNode) {
        media.parentNode.removeChild(media);
      }
      media = false;
    }
  }
  if (!media) {
    media = new Image();
    media.classList.add("figlio");
    contentEl.appendChild(media);

    media.addEventListener("load", () => {
      contentEl.style.opacity = "1";
    });

    if (url) {
      media.src = url;
    }
  }

  // update prev/next buttons
  if (images && images.length) {
    const imageIndex = images.indexOf(url);

    const prevButton = lightboxEl.querySelector(".vbox-prev") as HTMLElement;
    const nextButton = lightboxEl.querySelector(".vbox-next") as HTMLElement;

    if (prevButton) {
      if (imageIndex > 0) {
        prevButton.removeAttribute("disabled");
        prevButton.dataset.url = images[imageIndex - 1];
      } else {
        prevButton.setAttribute("disabled", "disabled");

        prevButton.dataset.url = undefined;
      }
    }

    if (nextButton) {
      if (imageIndex < images.length - 1) {
        nextButton.removeAttribute("disabled");
        nextButton.dataset.url = images[imageIndex + 1];
      } else {
        nextButton.setAttribute("disabled", "disabled");
        nextButton.dataset.url = undefined;
      }
    }
  }
};

const openLightboxEl = (
  lightboxEl: HTMLElement,
  url: string,
  images: (string | undefined)[],
) => {
  // prepare navigating to next/prev images
  if (images && images.length) {
    const handleNextPrevClick = (event: Event) => {
      event.preventDefault();
      const target = event.target as HTMLElement;

      if (target.dataset.url) {
        loadLightboxImage(lightboxEl, target.dataset.url, images);
      }
    };

    const prevButton = lightboxEl.querySelector(".vbox-prev") as HTMLElement;
    const nextButton = lightboxEl.querySelector(".vbox-next") as HTMLElement;

    const handleNextPrevKey = (event: KeyboardEvent) => {
      const KEYS = {
        ESC: 27,
        LEFT: 37,
        RIGHT: 39,
      };
      let image;

      switch (event.keyCode) {
        case KEYS.ESC:
          closeLightboxEl(lightboxEl);
          break;
        case KEYS.LEFT:
          if (prevButton) {
            image = prevButton.dataset.url;
          }
          if (image !== "null") {
            loadLightboxImage(lightboxEl, image, images);
          }
          break;
        case KEYS.RIGHT:
          image = nextButton.dataset.url;
          if (image !== "null") {
            loadLightboxImage(lightboxEl, image, images);
          }
          break;
      }
    };

    if (nextButton) {
      nextButton.addEventListener("click", handleNextPrevClick);
    }

    if (prevButton) {
      prevButton.addEventListener("click", handleNextPrevClick);
    }
    window.addEventListener("keyup", handleNextPrevKey);
  }

  // open lightbox
  document.body.classList.add("vbox-open");
  document.body.appendChild(lightboxEl);
  lightboxEl.style.opacity = "1";
  lightboxEl.style.display = "block";

  // load image
  loadLightboxImage(lightboxEl, url, images);
};

const closeLightboxEl = (lightboxEl: HTMLElement) => {
  lightboxEl.style.opacity = "0";
  lightboxEl.style.display = "none";
  if (lightboxEl.parentNode) {
    lightboxEl.parentNode.removeChild(lightboxEl);
  }
  document.body.classList.remove("vbox-open");
};

const lightbox = {
  openLightbox,
};

export default lightbox;
