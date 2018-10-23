import moment from "moment";

import { TICKS } from "./config";

/**
 * Cull Y Axis. The built in culling does not provide enough control.
 *  - hide labels that are not every X_TICK_FREQUENCY ticks.
 *  - remove month abreviation from label for sequential dates that have
 *    the same month.
 * @param {NodeList} ticks X axis tick elements.
 */
function cullXAxis(ticks) {
  let tick, totalTicks, text, monthCache;

  let frequency = TICKS.X_FREQUENCY;
  if (ticks.length > 95) {
    frequency *= 2;
  }

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector("text");

    if (tick % frequency !== 0) {
      text.style.display = "none";
    } else {
      ticks[tick].classList.add("active");
      text.children[0].setAttribute("fill", "#000");
      const month = text.children[0].innerHTML.split(" ");
      if (month[0] === monthCache) {
        text.children[0].innerHTML = month[1];
      }
      monthCache = month[0];
    }
  }
}

/**
 * Cull Y Axis. The built in culling does not provide enough control.
 *  - hide labels that are not every Y_TICK_FREQUENCY ticks.
 * @param {NodeList} ticks Y axis tick elements.
 */
function cullYAxis(ticks) {
  let tick, totalTicks, text;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector("text");

    if (tick % TICKS.Y_FREQUENCY !== 0) {
      text.style.display = "none";
    } else {
      ticks[tick].classList.add("active");
    }
  }
}

/**
 * Update graph x and y axis formatting.
 * @param {HTMLElement} el Graph wrapping element.
 */
function formatAxis(el) {
  const xAxis = el.querySelector(".bb-axis-x");

  let ticks = xAxis.querySelectorAll(".tick");
  cullXAxis(ticks);

  const yAxis = el.querySelector(".bb-axis-y");

  ticks = yAxis.querySelectorAll(".tick");
  cullYAxis(ticks);
}

/**
 * Format the value displayed for each tick:
 * - Jan 1
 * @param {number} x Timestamp
 */
function formatXAxisTickLabels(x) {
  return moment(x).format("MMM D");
}

/**
 * Format the value displayed for each tick:
 * - 10
 * - 1.0k
 * - 1.0m
 * @param {number} y Value of the tick
 */
function formatYAxisTickLabels(y) {
  let str = y;
  if (y >= 1000000) {
    str = (y / 1000000).toFixed(1) + "m";
  } else if (y >= 1000) {
    str = (y / 1000).toFixed(1) + "k";
  }
  return str;
}

export {
  cullXAxis,
  cullYAxis,
  formatAxis,
  formatXAxisTickLabels,
  formatYAxisTickLabels
};
