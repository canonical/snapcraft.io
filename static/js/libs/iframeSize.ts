function iframeSize(wrapperSelector: string) {
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

  const width = wrapperEl.getBoundingClientRect().width;
  const height = width / IFRAME_RATIO;

  iframe.width = width.toString();
  iframe.height = height.toString();
}

export default iframeSize;
