import ReactDOM from "react-dom";
import React from "react";
import Media from "../form/media";
import { MEDIA_RESTRICTIONS } from "./restrictions";

function initMedia(mediaHolder, images, updateState) {
  const mediaHolderEl = document.querySelector(mediaHolder);
  if (!mediaHolderEl) {
    throw new Error("No media holder El");
  }

  ReactDOM.render(
    <Media
      mediaData={images}
      updateState={updateState}
      restrictions={MEDIA_RESTRICTIONS}
    />,
    mediaHolderEl
  );
}

export { initMedia };
