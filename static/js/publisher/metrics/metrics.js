import React from "react";
import { render } from "react-dom";

import activeDevicesMetrics from "./graphs/activeDevices";
import territoriesMetrics from "./graphs/territories";
import SnapInstalls from "./graphs/snapInstalls";

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  // Active devices
  let activeDevices = {
    series: [],
    buckets: metrics.activeDevices.metrics.buckets
  };

  metrics.activeDevices.metrics.series.forEach(series => {
    let fullSeries = series.values.map(value => {
      return value === null ? 0 : value;
    });
    activeDevices.series.push({
      name: series.name,
      values: fullSeries
    });
  });

  activeDevicesMetrics(
    metrics.activeDevices.selector,
    activeDevices,
    metrics.activeDevices.type,
    metrics.defaultTrack,
    metrics.activeDevices.annotations
  );

  // Territories
  territoriesMetrics(metrics.territories.selector, metrics.territories.metrics);
}

/**
 * Render publisher page metrics
 * @param {Object} options An object with rendering options.
 */
function renderPublisherMetrics(options) {
  const { token, selector, snaps } = options;
  render(
    <SnapInstalls snaps={snaps} token={token} />,
    document.querySelector(selector)
  );
}

export { renderMetrics, renderPublisherMetrics };
