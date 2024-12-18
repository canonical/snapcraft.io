import { format } from "date-fns";

import { TICKS } from "./config";

function cullXAxis(ticks: NodeListOf<HTMLElement>) {
  let tick, totalTicks, text, monthCache;

  let frequency = TICKS.X_FREQUENCY;
  if (ticks.length > 95) {
    frequency *= 2;
  }

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector("text") as SVGElement;

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

function cullYAxis(ticks: NodeListOf<HTMLElement>) {
  let tick, totalTicks, text;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector("text") as SVGElement;

    if (tick % TICKS.Y_FREQUENCY !== 0) {
      text.style.display = "none";
    } else {
      ticks[tick].classList.add("active");
    }
  }
}

function formatAxis(el: HTMLElement) {
  const xAxis = el.querySelector(".bb-axis-x") as HTMLElement;

  let ticks = xAxis.querySelectorAll(".tick") as NodeListOf<HTMLElement>;
  cullXAxis(ticks);

  const yAxis = el.querySelector(".bb-axis-y") as HTMLElement;

  ticks = yAxis.querySelectorAll(".tick");
  cullYAxis(ticks);
}

function formatXAxisTickLabels(x: string) {
  return format(new Date(x), "MMM D");
}

function formatYAxisTickLabels(y: number) {
  let str = y as unknown as string;
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
  formatYAxisTickLabels,
};
