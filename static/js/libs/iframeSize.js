import debounce from "./debounce";

// This is a peculiar ratio because youtube seems to be 2 pixels narrower than
// 16 / 9, so add's black lines to either side of the video
const IFRAME_RATIO = 643 / 362;

/**
 *
 * @param wrapperSelector   A query selector for the wrapping element
 *                           This element is used to define how wide the iframe
 *                           should be.
 *                           It's also used to find the iframe element.
 * @param maxWidth  The maximum width the iframe should go.
 */
function sizeIframe(wrapperSelector, maxWidth) {
  const wrapperEl = document.querySelector(wrapperSelector);
  if (!wrapperEl) {
    return;
  }

  const iframe = wrapperEl.querySelector("iframe");

  // asciinema is a snowflake, so treat it as such
  if (!iframe || (iframe.name && iframe.name.indexOf("asciicast") !== -1)) {
    return;
  }

  const width = wrapperEl.clientWidth;
  if (width < maxWidth) {
    iframe.width = width;
    iframe.height = width / IFRAME_RATIO;
  } else if (iframe.width !== maxWidth) {
    iframe.width = maxWidth;
    iframe.height = maxWidth / IFRAME_RATIO;
  }
}

export default (wrapperSelector, maxWidth) => {
  window.addEventListener(
    "resize",
    debounce(sizeIframe.bind(this, wrapperSelector, maxWidth), 100)
  );

  sizeIframe(wrapperSelector, maxWidth);
};
