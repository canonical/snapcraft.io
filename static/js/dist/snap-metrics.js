this.snapcraft = this.snapcraft || {};
this.snapcraft.metrics = (function () {
'use strict';

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
  const xAxis = el.querySelector('.bb-axis-x');

  let ticks = xAxis.querySelectorAll('.tick');
  cullXAxis(ticks);

  const yAxis = el.querySelector('.bb-axis-y');

  ticks = yAxis.querySelectorAll('.tick');
  cullYAxis(ticks);
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
  let str = y;
  if (y >= 1000000) {
    str = (y / 1000000).toFixed(1) + 'm';
  } else if (y >= 1000) {
    str = (y / 1000).toFixed(1) + 'k';
  }
  return str;
}

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

class Mouse {
  constructor() {
    this.position = {x: 0, y: 0};

    window.addEventListener('mousemove', this.updatePosition.bind(this));
  }

  updatePosition(e) {
    this.position = {
      x: e.x,
      y: e.y
    };
  }
}

const mouse = new Mouse();

/**
 * Generate the tooltip.
 * @param {Object} data The point data.
 * @returns {String} A string of HTML.
 */
function snapcraftGraphTooltip(colors, data) {
  let contents = ['<div class="p-tooltip p-tooltip--top-center">'];
  contents.push('<span class="p-tooltip__message" role="tooltip">');
  contents.push('<span class="snapcraft-graph-tooltip__title">' + moment(data[0].x).format('YYYY-MM-DD') + '</span>');
  data.forEach(function (point, i) {
    let color = colors[i];
    contents.push('<span class="snapcraft-graph-tooltip__series">');
    contents.push('<span class="snapcraft-graph-tooltip__series-name">' + point.name + '</span>');
    contents.push('<span class="snapcraft-graph-tooltip__series-color" style="background: ' + color + ';"></span>');
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
function positionTooltip(installsMetricsOffset, graphHolder, data, width, height, element) {
  const tooltipHalfWidth = graphHolder
    .querySelector('.p-tooltip__message')
    .clientWidth / 2;
  const elementHalfWidth = parseFloat(element.getAttribute('width')) / 2;
  const elementSixthHeight = parseFloat(element.getAttribute('height')) / 6;
  let leftModifier = -4;
  const parent = element.parentNode;

  if (parent.firstChild === element) {
    leftModifier -= 3;
  } else if (parent.lastChild === element) {
    leftModifier += 4;
  }

  return {
    left: Math.floor(
      parseInt(element.getAttribute('x')
    ) + tooltipHalfWidth + elementHalfWidth) + leftModifier,
    top: Math.floor(
      (mouse.position.y - installsMetricsOffset.top) + window.scrollY - elementSixthHeight
    )
  };
}

const COLORS = {
  installs: '#94519E',
  activeDevices: ['#FFE8C8','#FCBB83','#E74A37']
};

function showGraph(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

function installsMetrics$1(days, installs) {
  const el = document.getElementById('installs_metrics');
  const installsMetricsOffset = {
    left: el.offsetLeft,
    top: el.offsetTop
  };

  const installsMetrics = bb.generate({
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
      contents: snapcraftGraphTooltip.bind(this, [COLORS.installs]),
      position: positionTooltip.bind(this, installsMetricsOffset, el)
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

  showGraph(el);

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = 0;
      debounce(function () {
        installsMetrics.resize();
        showGraph(el);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener('resize', resize);

  return installsMetrics;
}

function showGraph$1(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

function activeDevices(days, activeDevices) {
  const el = document.getElementById('active_devices');
  const elOffset = {
    left: el.offsetLeft,
    top: el.offsetTop
  };

  let types = {};
  let colors = {};
  let _colors = COLORS.activeDevices.slice(0);

  const group = activeDevices.map(version => {
    const name = version[0];
    types[name] = 'area-spline';
    colors[name] = _colors.shift();
    return name
  });

  function findStart(data) {
    for (let i = 0, ii = data.length; i < ii; i += 1) {
      if (data[i] !== 0) {
        return i;
      }
    }
    return 0;
  }

  function findEnd(data) {
    for (let i = data.length; i > 0; i -= 1) {
      if (data[i] !== 0) {
        return i;
      }
    }
    return data.length - 1;
  }

  function getHighest(data) {
    let highestIndex = 0;
    let highestValue = 0;
    for (let i = 0, ii = data.length ; i < ii; i += 1) {
      if (data[i] > highestValue) {
        highestValue = data[i];
        highestIndex = i;
      }
    }

    return {
      index: highestIndex,
      value: highestValue
    };
  }

  const labelPosition = function(labelText, data) {
    data.shift();
    const start = findStart(data);
    const end = findEnd(data);
    const highestIndex = getHighest(data).index;

    const labelClass = labelText.replace('.', '-');
    const area = document.querySelector(`.bb-areas-${labelClass}`);
    const bbox = area.getBBox();
    const sliceWidth = Math.round(bbox.width / data.length);

    const leftPadding = sliceWidth * start;
    const width = sliceWidth * (end - start);

    let highestIndexPull = ((highestIndex - start) * sliceWidth) / 4;
    if (highestIndex < end - start) {
      highestIndexPull *= -1;
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('stroke', '#000');
    label.setAttribute('x', leftPadding + bbox.x + (width / 2) + highestIndexPull);
    label.setAttribute('y', bbox.y + (bbox.height / 2));
    const labelSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    labelSpan.innerHTML = labelText;
    label.appendChild(labelSpan);
    area.appendChild(label);
  };

  const activeDevicesMetrics = bb.generate({
    bindto: '#active_devices',
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
      contents: snapcraftGraphTooltip.bind(this, COLORS.activeDevices),
      position: positionTooltip.bind(this, elOffset, el)
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
    resize: {
      auto: false
    },
    point: {
      show: false
    },
    data: {
      colors: colors,
      types: types,
      groups: [
        group
      ],
      x: 'x',
      columns: [days].concat(activeDevices)
    }
  });

  showGraph$1(el);
  labelPosition('1.0', activeDevices[0].slice(0));
  labelPosition('1.1', activeDevices[1].slice(0));
  labelPosition('1.2', activeDevices[2].slice(0));

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = 0;
      debounce(function () {
        installsMetrics.resize();
        showGraph$1(el);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener('resize', resize);

  return activeDevicesMetrics;
}

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || ! bb) {
    return false;
  }

  console.log(metrics);

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

  installsMetrics$1(days, installs);

  // Active devices
  const activeDevicesSeries = metrics['active_devices'].series;
  let activeDevices$$1 = [];
  activeDevicesSeries.forEach(series => {
    let fullSeries = series.values;
    fullSeries.unshift(series.name);
    activeDevices$$1.push(fullSeries);
  });

  console.log(days);
  console.log(activeDevices$$1);

  activeDevices(days, activeDevices$$1);
}

var metrics = {
  renderMetrics: renderMetrics
};

return metrics;

}());
