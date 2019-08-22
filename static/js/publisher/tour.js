import React from "react";
import ReactDOM from "react-dom";

import Tour from "./tour/tour";

export default function initTour({ container, target }) {
  if (document.contains(container) && document.contains(target)) {
    ReactDOM.render(<Tour target={target} />, container);
  } else {
    throw Error("initTour container or target elements not found in document");
  }
}
