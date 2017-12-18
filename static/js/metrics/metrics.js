import debounce from '../libs/debounce';
import {cullXAxis, cullYAxis, formatAxis} from './axis';
import {snapcraftGraphTooltip, positionTooltip} from './tooltips';
import installsMetrics from './graphs/installs';

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || ! bb) {
    return false;
  }

  console.log(metrics);

  var COLORS = {
    installs: '#94519E'
  };

  /**
   * Format the value displayed for each tick: 
   * - Jan 1
   * @param {number} x Timestamp
   */
  function formatXAxisTickLabels(x) {
    return moment(x).format('MMM D');
  }

  /**
   * Format the value displayed for each tick:
   * - 10
   * - 1.0k
   * - 1.0m
   * @param {number} y Value of the tick
   */
  function formatYAxisTickLabels(y) {
    var str = y;
    if (y >= 1000000) {
      str = (y / 1000000).toFixed(1) + 'm';
    } else if (y >= 1000) {
      str = (y / 1000).toFixed(1) + 'k';
    }
    return str;
  }

  /**
   * Formats axis and shows the graph.
   */
  function showGraphs() {
    formatAxis(installsMetricsEl);
    installsMetricsEl.style.opacity = 1;
  }

  var days = metrics.installs.buckets;
  // Convert to moment object.
  days = days.map(function (day) {
    return moment(day);
  });
  // Prepend 'x'.
  days.unshift('x'); 


  var installs = metrics.installs.series[0].values;
  // Prepend 'installs'.
  installs.unshift(metrics.installs.series[0].name);

  var mousePosition = {x: 0, y: 0};

  // Installs Metrics
  var installsMetricsEl = document.getElementById('installs_metrics');
  var installsMetricsOffset = {
    left: installsMetricsEl.offsetLeft,
    top: installsMetricsEl.offsetTop
  };
  var installsMetrics = installsMetrics(
    snapcraftGraphTooltip, 
    positionTooltip,
    formatXAxisTickLabels,
    formatYAxisTickLabels,
    COLORS,
    days,
    installs);

  showGraphs();

  // Extra events
  var installMetricsElWidth = installsMetricsEl.clientWidth;
  var resize = debounce(function () {
    var el = installsMetricsEl;

    if (el.clientWidth !== installMetricsElWidth) {
      el.style.opacity = 0;
      debounce(function () {
        installsMetrics.resize();
        showGraphs();
        installMetricsElWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  var mouseMove = function(e) {
    mousePosition = {
      x: e.x,
      y: e.y
    };
  };

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', mouseMove);
}

export default {
  renderMetrics: renderMetrics
};