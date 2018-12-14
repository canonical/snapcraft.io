function youtube(holderEl, url) {
  const frame = document.createElement("iframe");
  frame.id = "ytplayer";
  frame.type = "text/html";
  frame.width = 440;
  frame.height = 248;
  frame.src = `${url}?autoplay=0&origin=${window.location.href}`;
  frame.setAttribute("frameborder", "0");
  holderEl.appendChild(frame);
}

function videos(holderSelector) {
  const holderEl = document.querySelector(holderSelector);

  if (!holderEl) {
    throw new Error("Video holder doesn't exist");
  }

  const videoType = holderEl.dataset.videoType;
  const videoUrl = holderEl.dataset.videoUrl;

  switch (videoType) {
    case "youtube":
      youtube(holderEl, videoUrl);
      break;
    default:
  }
}

export default videos;
