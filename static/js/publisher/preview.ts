import markdownit from "markdown-it";
import {
  default as initScreenshots,
  terminateScreenshots,
} from "../public/snap-details/screenshots";
import { diffState } from "./state";
// Ensure markdown is set to be the same as `webapp/markdown.py` config
// doesn't include the custom ascii bullet-point (as this is legacy
// and shouldn't be promoted).
const md = markdownit({
  linkify: true,
}).disable([
  "table",
  "blockquote",
  "hr",
  "reference",
  "heading",
  "lheading",
  "html_block",
  "replacements",
  "smartquotes",
  "escape",
  "strikethrough",
  "image",
  "html_inline",
  "fence",
  "link",
]);

// For the different elements we might need to change different properties
const functionMap: { [key: string]: any } = {
  title: (el: any, content: any) => (el.innerHTML = content),
  summary: (el: any, content: any) => (el.innerHTML = content),
  description: (el: any, content: any) => (el.innerHTML = content),
  website: (el: any, content: any) => (el.href = content),
  contact: (el: any, content: any) => (el.href = content),
  screenshots: (el: any, content: any) => el.appendChild(content),
  license: (el: any, content: any) => (el.innerHTML = content),
  icon: (el: any, content: any) => {
    if (content) {
      el.src = content;
    } else {
      el.src =
        "https://assets.ubuntu.com/v1/6fbb3483-snapcraft-default-snap-icon.svg";
    }
  },
};

// For some elements we want to hide/ show a different element to the one
// being targeted.
const hideMap: { [key: string]: any } = {
  screenshots: (el: { parentNode: any }) => el.parentNode,
  website: (el: { parentNode: any }) => el.parentNode,
  contact: (el: { parentNode: any }) => el.parentNode,
};

// For some fields we need to transform the data.
const transformMap: { [key: string]: any } = {
  description: md.render.bind(md),
};

function transformStateImages(state: {
  [x: string]: any;
  images: Array<{
    type: string;
    url: string;
  }>;
}) {
  const newState: any = {
    icon: null,
    screenshots: [],
  };

  if (state.images) {
    state.images.forEach((image: { [key: string]: any }) => {
      if (image.type === "icon") {
        newState.icon = image.url;
      } else if (image.type === "screenshot") {
        newState.screenshots.push(image.url);
      }
    });
  }

  Object.keys(state).forEach((key) => {
    newState[key] = state[key];
  });

  return newState;
}

function getVideoDetails(url: string) {
  if (url.indexOf("youtube") > -1) {
    return {
      type: "youtube",
      url: url.replace("watch?v=", "embed/"),
      id: url.split("v=")[1].split("&")[0],
    };
  }
  if (url.indexOf("youtu.be") > -1) {
    return {
      type: "youtube",
      url: url.replace("youtu.be/", "youtube.com/embed/"),
      id: url.split("/")[1].split("?")[0],
    };
  }
  if (url.indexOf("vimeo") > -1) {
    const splitUrl = url.split("/");
    return {
      type: "vimeo",
      url: url.replace("vimeo.com/", "player.vimeo.com/video/"),
      id: splitUrl[splitUrl.length - 1],
    };
  }
  if (url.indexOf("asciinema") > -1) {
    const splitUrl = url.split("/");
    return {
      type: "asciinema",
      url: `${url}.js`,
      id: splitUrl[splitUrl.length - 1],
    };
  }
  return url;
}

function screenshot(image: string | undefined) {
  const slide = document.createElement("div");
  slide.className = "p-carousel__item--screenshot swiper-slide";
  const img: any = new Image();
  img.src = image;
  img.dataset.original = image;

  slide.appendChild(img);
  return slide;
}

function screenshotsAndVideos(screenshots: any[], video: string) {
  if (video) {
    const videoDetails: any = getVideoDetails(video);
    const holder = document.createElement("div");
    holder.className = "p-snap-details__media row u-equal-height";
    const col10 = document.createElement("div");
    col10.className = "col-10 u-align--center";
    holder.appendChild(col10);
    const videoSlide = document.createElement("div");
    videoSlide.className = "js-video-slide u-embedded-media";
    videoSlide.setAttribute("data-video-type", videoDetails.type);
    videoSlide.setAttribute("data-video-url", videoDetails.url);
    videoSlide.setAttribute("data-video-id", videoDetails.id);
    const videoTemplate = document.querySelector(
      `#video-${videoDetails.type}-template`
    );
    if (!videoTemplate) {
      throw new Error("Video template not available");
    }
    let videoHTML = videoTemplate.innerHTML
      .split("${url}")
      .join(videoDetails.url)
      .split("${id}")
      .join(videoDetails.id);

    if (videoDetails.type === "asciinema") {
      const fakeHolder = document.createElement("div");
      fakeHolder.innerHTML = videoHTML;
      const fakeScript: any = fakeHolder.children[0];
      const scriptTag = document.createElement("script");
      fakeScript.getAttributeNames().forEach((attr: any) => {
        scriptTag.setAttribute(attr, fakeScript.getAttribute(attr));
      });

      videoSlide.appendChild(scriptTag);
    } else {
      videoSlide.innerHTML = videoHTML;
    }

    col10.appendChild(videoSlide);

    if (screenshots) {
      const col2 = document.createElement("div");
      col2.className = "col-2 p-snap-details__media-items";
      if (screenshots.length > 3) {
        col2.classList.add("p-snap-details__media-items--distributed");
      }

      screenshots.map(screenshot).forEach((image) => {
        col2.appendChild(image);
      });

      holder.appendChild(col2);
    }

    return holder;
  }
  if (screenshots.length === 0) {
    return null;
  }
  const holder = document.createElement("div");
  holder.className = "p-carousel u-no-margin--bottom u-no-margin--top";
  const container = document.createElement("div");
  container.className = "swiper-container";
  holder.appendChild(container);
  const wrapper = document.createElement("div");
  wrapper.className = "swiper-wrapper";
  container.appendChild(wrapper);
  const next = document.createElement("button");
  next.className = "p-carousel__next swiper-button__next";
  next.innerText = "Next";
  holder.appendChild(next);
  const prev = document.createElement("button");
  prev.className = "p-carousel__prev swiper-button__prev";
  prev.innerText = "Previous";
  holder.appendChild(prev);
  screenshots.map(screenshot).forEach((image) => {
    wrapper.appendChild(image);
  });

  return holder;
}

function getState(packageName: string) {
  const storedPackage = window.localStorage.getItem(packageName);
  return storedPackage !== null ? JSON.parse(storedPackage) : {};
}

function sendCommand(packageName: any, command: string) {
  window.localStorage.setItem(`${packageName}-command`, command);
}

function render(packageName: string) {
  let transformedState: any;
  try {
    transformedState = transformStateImages(getState(packageName));
  } catch (e) {
    const notification = `<div class="p-notification--negative"><div class="p-notification__content">
<p class="p-notification__message">Something went wrong. Please ensure you have permission to preview this snap.</p></div>
</div>`;
    const snapHeading = document.querySelector(
      ".p-snap-heading"
    ) as HTMLElement;

    if (snapHeading.parentNode) {
      snapHeading.parentNode.appendChild(
        (() => {
          const el = document.createElement("div");
          el.innerHTML = notification;
          return el;
        })()
      );
    }
    return;
  }

  // For basic content, loop through and update the content
  Object.keys(transformedState).forEach(function (key: string) {
    if (key === "screenshots") {
      return;
    }
    const el = document.querySelector(`[data-live="${key}"]`);
    if (el && functionMap[key]) {
      let content = transformedState[key];
      if (transformMap[key]) {
        content = transformMap[key](transformedState[key]);
      }
      if (content !== "") {
        functionMap[key](el, content);

        if (hideMap[key]) {
          hideMap[key](el).classList.remove("u-hide");
        } else {
          el.classList.remove("u-hide");
        }
      } else {
        if (hideMap[key]) {
          hideMap[key](el).classList.add("u-hide");
        } else {
          el.classList.add("u-hide");
        }
      }
    }
  });

  // Screenshots are a bit more involved, so treat them separately
  const screenshotsEl = document.querySelector(
    `[data-live="screenshots"]`
  ) as HTMLElement;
  if (
    transformedState.video_urls !== "" ||
    transformedState.screenshots.length > 0
  ) {
    screenshotsEl.innerHTML = "";
    functionMap.screenshots(
      screenshotsEl,
      screenshotsAndVideos(
        transformedState.screenshot_urls,
        transformedState.video_urls
      )
    );
    hideMap.screenshots(screenshotsEl).classList.remove("u-hide");
    terminateScreenshots("#js-snap-screenshots");
    initScreenshots("#js-snap-screenshots");
  } else {
    hideMap.screenshots(screenshotsEl).classList.add("u-hide");
  }

  // We won't be changing any metrics, we just want to show them or not if selected
  // on the listings page.
  // Some of the elements won't exist because there aren't any metrics available, so make sure
  // to check the elements exist before doing modifications.
  const metricsEl = document.querySelector(`[data-live="public_metrics_live"]`);
  if (metricsEl) {
    const mapEl = metricsEl.querySelector(
      `[data-live="installed_base_by_country_percent"]`
    );
    const distroEl = metricsEl.querySelector(
      `[data-live="weekly_installed_base_by_operating_system_normalized"]`
    );

    if (transformedState.public_metrics_enabled) {
      metricsEl.classList.remove("u-hide");
    } else {
      metricsEl.classList.add("u-hide");
    }

    if (mapEl) {
      if (
        transformedState.public_metrics_blacklist.indexOf(
          "installed_base_by_country_percent"
        ) > -1
      ) {
        mapEl.classList.add("u-hide");
      } else {
        mapEl.classList.remove("u-hide");
      }
    }

    if (distroEl) {
      if (
        transformedState.public_metrics_blacklist.indexOf(
          "weekly_installed_base_by_operating_system_normalized"
        ) > -1
      ) {
        distroEl.classList.add("u-hide");
      } else {
        distroEl.classList.remove("u-hide");
      }
    }
  }

  // Remove the notification that you can edit the snap
  const snapOwnerNotification = document.querySelector(
    ".js-snap-owner-notification"
  );
  if (snapOwnerNotification) {
    snapOwnerNotification.classList.add("u-hide");
  }
}

function lostConnection(disableButtons: any) {
  const previewMessageEl = document.querySelector(
    "#preview-message"
  ) as HTMLElement;
  previewMessageEl.innerHTML = `<i class="p-icon--error"></i> This is taking longer then usual. You can click "Edit" to return to the form.`;
  disableButtons();
}

function establishedConnection(
  packageName: any,
  enableButtons: { (): void; (): void; (): void }
) {
  const previewMessageEl = document.querySelector(
    "#preview-message"
  ) as HTMLElement;
  previewMessageEl.innerHTML = `You are previewing the listing page for ${packageName}`;
  enableButtons();
}

/**
 * Initial render and storage change listener
 * @param packageName
 */
function preview(packageName: string) {
  let packageNameInitial = window.localStorage.getItem(
    `${packageName}-initial`
  );
  let initialState =
    packageNameInitial !== null ? JSON.parse(packageNameInitial) : "";
  let editButton: Element;
  let revertButton: Element;
  let saveButton: Element;

  let responseTimer: string | number | NodeJS.Timeout | undefined;
  let timedOut = false;
  const RESPONSE_TIMEOUT = 30000; // 30seconds

  const resetButtons = () => {
    if (editButton) {
      editButton.innerHTML = "Edit";
    }
    if (revertButton) {
      revertButton.innerHTML = "Revert";
    }
    if (saveButton) {
      saveButton.innerHTML = "Save";
    }
  };

  const disableButtons = () => {
    resetButtons();
    if (revertButton) {
      revertButton.setAttribute("disabled", "disabled");
    }
    if (saveButton) {
      saveButton.setAttribute("disabled", "disabled");
    }
  };

  const enableButtons = () => {
    resetButtons();
    if (revertButton) {
      revertButton.removeAttribute("disabled");
    }
    if (saveButton) {
      saveButton.removeAttribute("disabled");
    }
  };

  const checkState = () => {
    const state = getState(packageName);
    if (!diffState(initialState, state)) {
      disableButtons();
    } else {
      enableButtons();
    }
  };

  window.addEventListener("storage", (e) => {
    if (e.key === packageName) {
      // Slight delay to ensure the state has fully updated
      // There was an issue with images when it was immediate.
      setTimeout(() => {
        render(packageName);

        if (timedOut === true) {
          establishedConnection(packageName, enableButtons);
          timedOut = false;
        }

        if (responseTimer) {
          clearTimeout(responseTimer);
        }

        checkState();
      }, 500);
    } else if (e.key === `${packageName}-initial`) {
      resetButtons();

      // We've saved or reset the listing page form - the initialState might have changed
      if (e.newValue) {
        initialState = JSON.parse(e.newValue);
      }
      if (timedOut === true) {
        establishedConnection(packageName, enableButtons);
        timedOut = false;
      }
      if (responseTimer) {
        clearTimeout(responseTimer);
      }

      checkState();
    }
  });

  setTimeout(() => {
    checkState();
    render(packageName);
  }, 500);

  // Init the toolbar
  editButton = document.querySelector(".js-edit") as HTMLElement;
  revertButton = document.querySelector(".js-revert") as HTMLElement;
  saveButton = document.querySelector(".js-save") as HTMLElement;

  const timeoutTimer = () => {
    responseTimer = window.setTimeout(() => {
      lostConnection(disableButtons);
      timedOut = true;
    }, RESPONSE_TIMEOUT);
  };

  editButton.addEventListener("click", (e) => {
    e.preventDefault();
    timeoutTimer();
    sendCommand(packageName, "edit");
    editButton.innerHTML = `<i class="p-icon--spinner u-animation--spin"></i>`;
    window.close();
  });
  revertButton.addEventListener("click", (e) => {
    e.preventDefault();
    disableButtons();
    timeoutTimer();
    sendCommand(packageName, "revert");
    revertButton.innerHTML = `<i class="p-icon--spinner u-animation--spin"></i>`;
  });
  saveButton.addEventListener("click", (e) => {
    e.preventDefault();
    disableButtons();
    timeoutTimer();
    sendCommand(packageName, "save");
    saveButton.innerHTML = `<i class="p-icon--spinner u-animation--spin"></i>`;
  });
}

export { preview };
