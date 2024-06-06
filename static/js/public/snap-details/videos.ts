function vimeo() {
  const vimeoPlayerScript = document.createElement("script");
  vimeoPlayerScript.src = "https://player.vimeo.com/api/player.js";
  const firstScript = document.getElementsByTagName("script")[0] as HTMLElement;

  if (firstScript.parentNode) {
    firstScript.parentNode.insertBefore(vimeoPlayerScript, firstScript);
  }

  const frame = document.getElementById("vimeoplayer");

  const vimeoReady = () => {
    const player = new window.Vimeo.Player(frame);
    player.on("play", function () {
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

function asciinema(
  this: any,
  holderEl: { querySelector: (arg0: string) => any }
) {
  const asciinemaPlayer = holderEl.querySelector("iframe");

  if (!asciinemaPlayer) {
    setTimeout(asciinema.bind(this, holderEl), 200);
    return;
  }
}

function videos(holderSelector: any) {
  const holderEl = document.querySelector(holderSelector);

  if (!holderEl) {
    return;
  }

  const videoType = holderEl.dataset.videoType;

  const iframe = holderEl.querySelector("iframe");
  if (iframe && iframe.src && iframe.src.indexOf("http://") !== -1) {
    iframe.src = iframe.src.replace("http://", "https://");
  }

  if (videoType === "vimeo") {
    vimeo();
  } else if (videoType === "asciinema") {
    asciinema(holderEl);
  }
}

export default videos;
