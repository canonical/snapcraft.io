import debounce from "./debounce";

/**
 *
 * @param wrapperSelector   A query selector for the wrapping element
 *                           This element is used to define how wide the iframe
 *                           should be.
 *                           It's also used to find the iframe element.
 * @param maxWidth  The maximum width the iframe should go.
 */
function sizeIframe(wrapperSelector: string) {
  const wrapperEl = document.querySelector(wrapperSelector);
  if (!wrapperEl) {
    return;
  }

  const iframe = wrapperEl.querySelector("iframe") as HTMLIFrameElement;

  // asciinema is a snowflake, so treat it as such
  if (!iframe || (iframe.name && iframe.name.indexOf("asciicast") !== -1)) {
    return;
  }

  const IFRAME_RATIO = parseInt(iframe.width) / parseInt(iframe.height);

  const width = wrapperEl.clientWidth;
  const height = width / IFRAME_RATIO;

  iframe.width = width.toString();
  iframe.height = height.toString();
}

export default (wrapperSelector: string) => {
  window.addEventListener(
    "resize",
    debounce(sizeIframe.bind(this, wrapperSelector), 100)
  );

  sizeIframe(wrapperSelector);
};
