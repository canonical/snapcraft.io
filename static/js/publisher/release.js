import React from "react";
import ReactDOM from "react-dom";

import ReleasesController from "./release/releasesController";

const initReleases = (id, snapName, releasesData, channelMapsList, options) => {
  ReactDOM.render(
    <ReleasesController
      snapName={snapName}
      channelMapsList={channelMapsList}
      releasesData={releasesData}
      options={options}
    />,
    document.querySelector(id)
  );
};

export { initReleases };
