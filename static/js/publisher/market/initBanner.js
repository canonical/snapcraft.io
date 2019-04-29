import React from "react";
import ReactDOM from "react-dom";
import Banner from "../form/banner";
import { BANNER_RESTRICTIONS } from "./restrictions";

function initBanner(holder, banners, nextState) {
  const bannerHolderEl = document.querySelector(holder);

  if (!bannerHolderEl) {
    throw new Error("No banner holder defined");
  }

  let banner = {};

  if (banners[0]) {
    banner = banners[0];
  }

  ReactDOM.render(
    <Banner
      bannerImage={banner}
      updateImageState={nextState}
      restrictions={BANNER_RESTRICTIONS}
    />,
    bannerHolderEl
  );
}

export { initBanner };
