/* globals d3 bb moment */

import activeDevicesMetrics from './graphs/activeDevices';
import territoriesMetrics from './graphs/territories';

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || !bb) {
    return false;
  }

  // Active devices
  let activeDevices = {
    series: [],
    buckets: metrics.activeDevices.metrics.buckets
  };
  metrics.activeDevices.metrics.series.forEach(series => {
    let fullSeries = series.values.map(value => {
      return value === null ? 0 : value;
    });
    fullSeries.unshift(series.name);
    activeDevices.series.push(fullSeries);
  });

  activeDevices.buckets = activeDevices.buckets.map(bucket => {
    return moment(bucket);
  });
  activeDevices.buckets.unshift('x');

  activeDevicesMetrics(
    activeDevices.buckets,
    activeDevices.series,
    metrics.activeDevices.type
  );

  // Territories
  territoriesMetrics('#territories', metrics.territories);
}

export default renderMetrics;
