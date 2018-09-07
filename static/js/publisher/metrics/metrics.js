import activeDevicesMetrics from './graphs/activeDevices';
import territoriesMetrics from './graphs/territories';

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

  activeDevicesMetrics(metrics.activeDevices.selector, activeDevices);

  // Territories
  territoriesMetrics(metrics.territories.selector, metrics.territories.metrics);
}

export default renderMetrics;
