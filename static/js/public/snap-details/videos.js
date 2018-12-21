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

function asciinema(holderEl) {
  const asciinemaPlayer = holderEl.querySelector("iframe");

  if (!asciinemaPlayer) {
    setTimeout(asciinema.bind(this, holderEl), 200);
    return;
  }

  const parent = asciinemaPlayer.parentNode;
  const blocker = holderEl.querySelector(".p-carousel__item-blocker");

  blocker.addEventListener("click", e => {
    e.stopImmediatePropagation();
    if (document.fullscreenEnabled) {
      parent.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", () => {
    const fullScreenEl = document.fullscreenElement;
    if (fullScreenEl && fullScreenEl === parent) {
      parent.classList.add("is-fullscreen");
    } else {
      parent.classList.remove("is-fullscreen");
    }
  });
}

function videos(holderSelector) {
  const holderEl = document.querySelector(holderSelector);

  if (!holderEl) {
    return;
  }

  const videoType = holderEl.dataset.videoType;

  if (videoType === "vimeo") {
    vimeo();
  } else if (videoType === "asciinema") {
    asciinema(holderEl);
  }
}

export default videos;
