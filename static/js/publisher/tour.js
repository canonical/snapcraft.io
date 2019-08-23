import React from "react";
import ReactDOM from "react-dom";

import Tour from "./tour/tour";

export default function initTour({ container, steps }) {
  if (!document.contains(container)) {
    throw Error("initTour container element not found in document.");
  }
  if (!steps || !steps.length) {
    throw Error("initTour expects steps array as an argument.");
  }

  ReactDOM.render(<Tour steps={steps} />, container);
}
