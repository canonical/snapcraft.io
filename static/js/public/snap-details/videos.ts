function vimeo(): void {
  const vimeoPlayerScript = document.createElement("script");
  vimeoPlayerScript.src = "https://player.vimeo.com/api/player.js";
  const firstScript = document.getElementsByTagName("script")[0] as HTMLElement;

  if (firstScript.parentNode) {
    firstScript.parentNode.insertBefore(vimeoPlayerScript, firstScript);
  }

  const frame = document.getElementById(
    "vimeoplayer",
  ) as HTMLIFrameElement | null;

  const vimeoReady = (): void => {
    if (frame && window.Vimeo && window.Vimeo.Player) {
      const player = new window.Vimeo.Player(frame);
      player.on("play", function () {
        player.setVolume(0);
      });
      player.play();
    }
  };

  const checkVimeo = (): void => {
    if (window.Vimeo && window.Vimeo.Player) {
      vimeoReady();
    } else {
      setTimeout(checkVimeo, 200);
    }
  };

  checkVimeo();
}

function asciinema(holderEl: HTMLElement): void {
  const asciinemaPlayer = holderEl.querySelector("iframe");

  if (!asciinemaPlayer) {
    setTimeout(() => {
      asciinema(holderEl);
    }, 200);
    return;
  }
}

function videos(holderSelector: string): void {
  const holderEl = document.querySelector(holderSelector) as HTMLElement | null;

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
