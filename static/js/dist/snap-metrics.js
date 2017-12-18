this.snapcraft = this.snapcraft || {};
this.snapcraft.metrics = (function () {
'use strict';

/**
 * Debounce
 * @param {Function} func Function to run.
 * @param {Number} wait Time to wait between tries.
 * @param {Boolean} immediate Immediately call func.
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this, args = arguments;
    let later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

var X_TICK_FREQUENCY = 7;
var Y_TICK_FREQUENCY = 5;

/**
 * Cull Y Axis. The built in culling does not provide enough control.
 *  - hide labels that are not every X_TICK_FREQUENCY ticks.
 *  - remove month abreviation from label for sequential dates that have 
 *    the same month.
 * @param {NodeList} ticks X axis tick elements.
 */
function cullXAxis(ticks) {
  var tick, totalTicks, text, monthCache;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % X_TICK_FREQUENCY !== 0) {
      text.style.display = 'none';
    } else {
      ticks[tick].classList.add('active');
      text.children[0].setAttribute('fill', '#000');
      var month = text.children[0].innerHTML.split(' ');
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
  var tick, totalTicks, text;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % Y_TICK_FREQUENCY !== 0) {
      text.style.display = 'none';
    } else {
      ticks[tick].classList.add('active');
    }
  }
}

/**
 * Update graph x and y axis formatting.
 * @param {HTMLElement} el Graph wrapping element.
 */
function formatAxis(el) {
  console.log(el);
  var xAxis = el.querySelector('.bb-axis-x');

  console.log(xAxis);
  
  var ticks = xAxis.querySelectorAll('.tick');
  cullXAxis(ticks);

  var yAxis = el.querySelector('.bb-axis-y');

  ticks = yAxis.querySelectorAll('.tick');
  cullYAxis(ticks);
}

/**
 * Generate the tooltip.
 * @param {Object} data The point data.
 * @returns {String} A string of HTML.
 */

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || ! bb) {
    return false;
  }

  console.log(metrics);

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


  var installs$$1 = metrics.installs.series[0].values;
  // Prepend 'installs'.
  installs$$1.unshift(metrics.installs.series[0].name);

  var mousePosition = {x: 0, y: 0};

  // Installs Metrics
  var installsMetricsEl = document.getElementById('installs_metrics');
  var installsMetricsOffset = {
    left: installsMetricsEl.offsetLeft,
    top: installsMetricsEl.offsetTop
  };
  showGraphs();

  // Extra events
  var installMetricsElWidth = installsMetricsEl.clientWidth;
  var resize = debounce(function () {
    var el = installsMetricsEl;

    if (el.clientWidth !== installMetricsElWidth) {
      el.style.opacity = 0;
      debounce(function () {
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

var metrics = {
  renderMetrics: renderMetrics
};

return metrics;

}());
