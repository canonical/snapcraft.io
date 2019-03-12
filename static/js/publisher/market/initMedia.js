import ReactDOM from "react-dom";
import React from "react";
import Media from "../form/media";

function initMedia(mediaHolder, images, updateState) {
  const mediaHolderEl = document.querySelector(mediaHolder);
  if (!mediaHolderEl) {
    throw new Error("No media holder El");
  }

  ReactDOM.render(
    <Media mediaData={images} updateState={updateState} />,
    mediaHolderEl
  );
}

export { initMedia };
