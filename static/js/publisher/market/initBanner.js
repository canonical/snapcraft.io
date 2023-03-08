import React from "react";
import { createRoot } from "react-dom/client";
import Banner from "../form/banner";
import { BANNER_RESTRICTIONS } from "./restrictions";

function initBanner(holder, banners, nextState) {
  const container = document.querySelector(holder);

  if (!container) {
    throw new Error("No banner holder defined");
  }

  let banner = {};

  if (banners[0]) {
    banner = banners[0];
  }

  const root = createRoot(container);
  root.render(
    <Banner
      bannerImage={banner}
      updateImageState={nextState}
      restrictions={BANNER_RESTRICTIONS}
    />
  );
}

export { initBanner };
