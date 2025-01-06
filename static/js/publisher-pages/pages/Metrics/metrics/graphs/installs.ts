/* globals bb */

import {
  formatAxis,
  formatXAxisTickLabels,
  formatYAxisTickLabels,
} from "../axis";
import debounce from "../../../../../libs/debounce";
import { COLORS, PADDING } from "../config";

function showGraph(el: HTMLElement) {
  formatAxis(el);
  el.style.opacity = "1";
}

export default function installsMetrics(days: string, installs: string) {
  const el = document.getElementById("installs_metrics") as HTMLElement;

  // @ts-ignore
  const installsMetrics = bb.generate({
    bindto: "#installs_metrics",
    legend: {
      hide: true,
    },
    padding: PADDING,
    transition: {
      duration: 0,
    },
    point: {
      focus: false,
    },
    axis: {
      x: {
        tick: {
          culling: false,
          outer: true,
          format: formatXAxisTickLabels,
        },
      },
      y: {
        tick: {
          format: formatYAxisTickLabels,
        },
      },
    },
    bar: {
      width: 4,
    },
    resize: {
      auto: false,
    },
    data: {
      colors: COLORS,
      type: "bar",
      x: "x",
      columns: [days, installs],
    },
  });

  showGraph(el);

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = "0";
      // @ts-ignore
      debounce(function () {
        installsMetrics.resize();
        showGraph(el);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener("resize", resize);

  return installsMetrics;
}
