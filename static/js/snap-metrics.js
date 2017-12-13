/* global d3, bb, moment */

(function (window, d3, bb, moment) {
  /**
   * Debounce
   * @param {Function} func Function to run.
   * @param {Number} wait Time to wait between tries.
   * @param {Boolean} immediate Immediately call func.
   */
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  /**
   * Render all metrics
   * @param {Object} metrics An object of metrics from the API.
   */
  function renderMetrics(metrics) {
    if (!d3 || ! bb) {
      return false;
    }

    var X_TICK_FREQUENCY = 7;
    var Y_TICK_FREQUENCY = 5;

    var COLORS = {
      installs: '#94519E'
    };

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
      var xAxis = el.querySelector('.bb-axis-x');
      
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
    function snapcraftGraphTooltip(data) {
      var contents = ['<div class="p-tooltip p-tooltip--top-center">'];
      contents.push('<span class="p-tooltip__message" role="tooltip">');
      contents.push('<span class="snapcraft-graph-tooltip__title">' + moment(data[0].x).format('YYYY-MM-DD') + '</span>');
      data.forEach(function (point) {
        contents.push('<span class="snapcraft-graph-tooltip__series">');
        contents.push('<span class="snapcraft-graph-tooltip__series-name">' + point.name + '</span>');
        contents.push('<span class="snapcraft-graph-tooltip__series-color" style="background: ' + COLORS[point.name] + ';"></span>');
        contents.push('<span class="snapcraft-graph-tooltip__series-value"> ' + point.value + '</span>');
        contents.push('</span>');
      });
      contents.push('</span>');
      contents.push('</div>');
      return contents.join('');
    }

    /**
     * 
     * @param {Object} data The  point data.
     * @param {Number} width 
     * @param {Number} height 
     * @param {HTMLElement} element The tooltip event target element.
     * @returns {Object} Left and top offset of the tooltip.  
     */
    function positionTooltip(data, width, height, element) {
      var tooltipHalfWidth = installsMetricsEl
        .querySelector('.p-tooltip__message')
        .clientWidth / 2;
      var elementHalfWidth = parseFloat(element.getAttribute('width')) / 2;
      var elementSixthHeight = parseFloat(element.getAttribute('height')) / 6;
      return {
        left: Math.floor(
          parseInt(element.getAttribute('x')
        ) + tooltipHalfWidth + elementHalfWidth) - 4,
        top: Math.floor(
          (mousePosition.y - installsMetricsOffset.top) + window.scrollY - elementSixthHeight
        )
      };
    }

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
    var installsMetrics = bb.generate({
      bindto: '#installs_metrics',
      legend: {
        hide: true
      },
      padding: {
        top: 0,
        left: 72,
        bottom: 0,
        right: 112
      },
      tooltip: {
        contents: snapcraftGraphTooltip,
        position: positionTooltip
      },
      transition: {
        duration: 0
      },
      point: {
        focus: false
      },
      axis: {
        x: {
          tick: {
            culling: false,
            outer: true,
            format: formatXAxisTickLabels
          }
        },
        y: {
          tick: {
            format: formatYAxisTickLabels
          }
        }
      },
      bar: {
        width: 4
      },
      resize: {
        auto: false
      },
      data: {
        colors: COLORS,
        type: 'bar',
        x: 'x',
        columns: [
          days,
          installs
        ]
      }
    });   

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

  window.renderMetrics = renderMetrics;
})(window, d3, bb, moment);