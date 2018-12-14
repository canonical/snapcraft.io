function vimeo() {
  const vimeoPlayerScript = document.createElement("script");
  vimeoPlayerScript.src = "https://player.vimeo.com/api/player.js";
  const firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(vimeoPlayerScript, firstScript);

  const frame = document.getElementById("vimeoplayer");

  const vimeoReady = () => {
    const player = new window.Vimeo.Player(frame);
    player.on("play", function() {
      player.setVolume(0);
    });
    player.play();
  };

  const checkVimeo = () => {
    if (window.Vimeo) {
      vimeoReady();
    } else {
      setTimeout(checkVimeo, 200);
    }
  };

  checkVimeo();
}

function videos(holderSelector) {
  const holderEl = document.querySelector(holderSelector);

  if (!holderEl) {
    throw new Error("Video holder doesn't exist");
  }

  const videoType = holderEl.dataset.videoType;

  if (videoType === "vimeo") {
    vimeo();
  }
}

export default videos;
