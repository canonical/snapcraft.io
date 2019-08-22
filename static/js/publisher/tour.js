import React from "react";
import ReactDOM from "react-dom";

import Tour from "./tour/tour";

export default function initTour() {
  const tour = document.createElement("div");
  document.body.appendChild(tour);

  const target = document.querySelector("h2");
  ReactDOM.render(<Tour target={target} />, tour);
}
