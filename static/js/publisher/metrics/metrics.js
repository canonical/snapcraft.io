/* globals d3 bb moment */

import installsMetrics from './graphs/installs';
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

  // Installs Metrics
  let installs = metrics.installs;
  // Prepend 'installs'.
  installs.values.unshift('active_devices');

  installs.buckets = installs.buckets.map(bucket => {
    return moment(bucket);
  });
  installs.buckets.unshift('x');

  installsMetrics(
    installs.buckets,
    installs.values);

  // Active devices
  let activeDevices = {
    series: [],
    buckets: metrics.activeDevices.buckets
  };
  metrics.activeDevices.series.forEach(series => {
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
    activeDevices.series);

  // Territories
  territoriesMetrics('#territories', metrics.territories);
}

export default renderMetrics;