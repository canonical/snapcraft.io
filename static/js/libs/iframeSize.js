import debounce from "./debounce";

/**
 *
 * @param wrapperSelector   A query selector for the wrapping element
 *                           This element is used to define how wide the iframe
 *                           should be.
 *                           It's also used to find the iframe element.
 * @param maxWidth  The maximum width the iframe should go.
 */
function sizeIframe(wrapperSelector) {
  const wrapperEl = document.querySelector(wrapperSelector);
  if (!wrapperEl) {
    return;
  }

  const iframe = wrapperEl.querySelector("iframe");

  // asciinema is a snowflake, so treat it as such
  if (!iframe || (iframe.name && iframe.name.indexOf("asciicast") !== -1)) {
    return;
  }

  const IFRAME_RATIO = iframe.width / iframe.height;

  const width = wrapperEl.clientWidth;

  iframe.width = width;
  iframe.height = width / IFRAME_RATIO;
}

export default wrapperSelector => {
  window.addEventListener(
    "resize",
    debounce(sizeIframe.bind(this, wrapperSelector), 100)
  );

  sizeIframe(wrapperSelector);
};
