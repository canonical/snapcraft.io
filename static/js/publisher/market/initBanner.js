import React from "react";
import ReactDOM from "react-dom";
import Banner from "../form/banner";

function initBanner(holder, state, nextState) {
  const bannerHolderEl = document.querySelector(holder);

  if (!bannerHolderEl) {
    throw new Error("No banner holder defined");
  }

  let bannerBackground = {};
  let bannerIcon = {};

  if (state.images) {
    const bannerImages = state.images.filter(image => image.is_banner);

    if (bannerImages.length > 0) {
      const bannerBackgrounds = bannerImages.filter(
        image => image.url.indexOf("icon") === -1
      );
      if (bannerBackgrounds.length > 0) {
        bannerBackground = bannerBackgrounds[0];
      }
      const bannerIcons = bannerImages.filter(
        image => image.url.indexOf("icon") > -1
      );
      if (bannerIcons.length > 0) {
        bannerIcon = bannerIcons[0];
      }
    }
  }

  const updateImageState = images => {
    const normalImages = state.images.filter(image => !image.is_banner);
    nextState({
      ...state,
      images: normalImages.concat(images)
    });
  };

  ReactDOM.render(
    <Banner
      bannerImage={bannerBackground}
      bannerIcon={bannerIcon}
      updateImageState={updateImageState}
    />,
    bannerHolderEl
  );
}

export { initBanner };
