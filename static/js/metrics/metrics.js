/* globals d3 bb moment */

import installsMetrics from './graphs/installs';

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || !bb) {
    return false;
  }

  let days = metrics.installs.buckets;
  // Convert to moment object.
  days = days.map(function (day) {
    return moment(day);
  });
  // Prepend 'x'.
  days.unshift('x');


  // Installs Metrics
  let installs = metrics.installs.series[0].values;
  // Prepend 'installs'.
  installs.unshift(metrics.installs.series[0].name);

  installsMetrics(days, installs);

  // Active devices
  const activeDevicesSeries = metrics['active_devices'].series;
  let activeDevices = [];
  activeDevicesSeries.forEach(series => {
    let fullSeries = series.values;
    fullSeries.unshift(series.name);
    activeDevices.push(fullSeries);
  });

  activeDevicesMetrics(days, activeDevices);
}

export default {
  renderMetrics: renderMetrics
};