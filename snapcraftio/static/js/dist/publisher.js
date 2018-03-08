this.snapcraft = this.snapcraft || {};
this.snapcraft.publisher = (function (exports) {
'use strict';

const TICKS = {
  X_FREQUENCY: 7,
  Y_FREQUENCY: 5
};

const PADDING = {
  top: 0,
  left: 72,
  bottom: 0,
  right: 0
};

const COLOR_SCALE = {
  start: [ 255, 232, 200 ],
  end: [ 226, 74, 51 ]
};

/* globals moment */

/**
 * Cull Y Axis. The built in culling does not provide enough control.
 *  - hide labels that are not every X_TICK_FREQUENCY ticks.
 *  - remove month abreviation from label for sequential dates that have 
 *    the same month.
 * @param {NodeList} ticks X axis tick elements.
 */
function cullXAxis(ticks) {
  let tick, totalTicks, text, monthCache;

  let frequency = TICKS.X_FREQUENCY;
  if (ticks.length > 95) {
    frequency *= 2;
  }

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % frequency !== 0) {
      text.style.display = 'none';
    } else {
      ticks[tick].classList.add('active');
      text.children[0].setAttribute('fill', '#000');
      const month = text.children[0].innerHTML.split(' ');
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
  let tick, totalTicks, text;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % TICKS.Y_FREQUENCY !== 0) {
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
    this.position = { x: 0, y: 0 };

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

/* globals moment */

function commaNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function generateSeriesMarkup(point, color, highlight) {
  let series = [];
  color = color || 'transparent';
  let extraClass = highlight === point.name ? ' is-hovered' : '';
  series.push(`<span class="snapcraft-graph-tooltip__series${extraClass}" title="${point.name}">`);
  series.push(`<span class="snapcraft-graph-tooltip__series-name">${point.name}</span>`);
  series.push(`<span class="snapcraft-graph-tooltip__series-color" style="background:${color};"></span>`);
  series.push(`<span class="snapcraft-graph-tooltip__series-value">${commaNumber(point.value)}</span>`);
  series.push('</span>');

  return series.join('');
}

/**
 * Generate the tooltip.
 * @param {Object} options
 * @param {Array} options.colors The colours used for the graph.
 * @param {Boolean} options.showLabels If true, always show labels.
 * @param {Object} data The point data.
 * @returns {String} A string of HTML.
 */
function snapcraftGraphTooltip(options, graphHolder, data) {
  const targets = graphHolder.querySelectorAll('.bb-target');
  for (let i = 0; i < targets.length; i += 1) {
    targets[i].style.pointerEvents = 'all';
  }
  const graphAtPoints = document.elementFromPoint(mouse.position.x, mouse.position.y);
  for (let i = 0; i < targets.length; i += 1) {
    targets[i].style.pointerEvents = 'none';
  }
  const highlight = graphAtPoints.dataset.label;
  let contents = ['<div class="p-tooltip p-tooltip--top-center">'];
  contents.push('<span class="p-tooltip__message" role="tooltip">');
  contents.push('<span class="snapcraft-graph-tooltip__title">' + moment(data[0].x).format('YYYY-MM-DD') + '</span>');
  let series = [];
  const total = data.reduce((a, b) => {
    return { value: a.value + parseInt(b.value) };
  }).value;
  let other = {
    count: 0,
    value: 0,
    name: 'other'
  };
  if (data.length === 1 && !options.showLabels) {
    series.push(`<span class="snapcraft-graph-tooltip__series">${commaNumber(data[0].value)}</span>`);
  } else {
    data.sort((a, b) => {
      return b.value - a.value;
    });
    data.forEach((point) => {
      let color = options.colors[point.name];
      if (point.value === 0) {
        return;
      }
      if (point.value / total < 0.001) {
        other.count += 1;
        other.value += point.value;
        return;
      }
      series.push(generateSeriesMarkup(point, color, highlight));
    });
  }
  if (other.count > 0) {
    other.name = other.count + ' other';
    series.push(generateSeriesMarkup(other, null));
  }
  if (series.length > 0) {
    contents = contents.concat(series);
  } else {
    contents.push('<span class="snapcraft-graph-tooltip__series">No data</span>');
  }
  contents.push('</span>');
  contents.push('</div>');
  return contents.join('');
}

/**
 *
 * @param {HTMLElement} graphHolder The window offset of the graphs holder.
 * @param {Object} data The point data.
 * @param {Number} width
 * @param {Number} height
 * @param {HTMLElement} element The tooltip event target element.
 * @returns {Object} Left and top offset of the tooltip.
 */
function positionTooltip(graphHolder, data, width, height, element) {
  const tooltipHalfWidth = graphHolder
    .querySelector('.p-tooltip__message')
    .clientWidth / 2;
  const elementHalfWidth = parseFloat(element.getAttribute('width')) / 2;
  const elementSixthHeight = parseFloat(element.getAttribute('height')) / 6;
  let leftModifier = -46; // This is directly related to the width of the tooltip
  const parent = element.parentNode;
  const graphHolderOffsetTop = graphHolder.offsetTop;

  let left = Math.floor(
    parseInt(
      element.getAttribute('x')
    ) + tooltipHalfWidth
  ) + leftModifier;

  if (parent.firstChild === element) {
    left += 5;
  } else if (parent.lastChild === element) {
    left += parseInt(element.getAttribute('width')) - 5;
  } else {
    left += elementHalfWidth;
  }

  return {
    left: left,
    top: Math.floor(
      (mouse.position.y - graphHolderOffsetTop) + window.scrollY - elementSixthHeight
    )
  };
}

var colorScale = function(steps) {
  const start = COLOR_SCALE.start;
  const end = COLOR_SCALE.end;

  const redSteps = (start[0] - end[0]) / steps;
  const greenSteps = (start[1] - end[1]) / steps;
  const blueSteps = (start[2] - end[2]) / steps;

  let colours = [end.slice(0)];

  let i = steps - 1;

  while(i > 0) {
    colours.unshift([
      Math.round(colours[0][0] + redSteps),
      Math.round(colours[0][1] + greenSteps),
      Math.round(colours[0][2] + blueSteps)
    ]);
    i--;
  }

  return colours;
};

/* globals bb */

function showGraph(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

function activeDevices(days, activeDevices, type) {
  const el = document.getElementById('active_devices');

  activeDevices.sort((a, b) => {
    const a1 = a.slice(1); // Remove the first item as it's the label
    const b1 = b.slice(1); // Same again.

    const reducer = (accumulator, currentValue) => {
      return accumulator + currentValue;
    };

    const a1Total = a1.reduce(reducer);
    const b1Total = b1.reduce(reducer);

    return b1Total - a1Total;
  });

  let groupedActiveDevices = {};
  let deviceData;

  if (type === 'os') {
    activeDevices.forEach(activeDevice => {
      let series = activeDevice.slice(0);
      let label = series[0];
      if(label.indexOf('ubuntu') == -1 && label.indexOf('/') > -1) {
        label = label.split('/')[0];
        series[0] = label;
      }
      if (!groupedActiveDevices[label]) {
        groupedActiveDevices[label] = [series.slice(1)];
      } else {
        groupedActiveDevices[label].push(series.slice(1));
      }
    });

    let mergedActiveDevices = [];
    Object.keys(groupedActiveDevices).forEach(key => {
      let base = groupedActiveDevices[key][0];
      for (let seriesIndex = groupedActiveDevices[key].length - 1; seriesIndex > 0; seriesIndex -= 1) {
        const series = groupedActiveDevices[key][seriesIndex];
        for (let valueIndex = 0, jj = series.length; valueIndex < jj; valueIndex += 1) {
          base[valueIndex] += series[valueIndex];
        }
      }
      groupedActiveDevices[key] = groupedActiveDevices[key][0];
      mergedActiveDevices.push([key].concat(groupedActiveDevices[key]));
    });

    deviceData = mergedActiveDevices;
  } else {
    deviceData = activeDevices;
  }

  let types = {};
  let colors = {};
  let _colors = colorScale(deviceData.length);
  let _colorIndex = 0;
  const group = deviceData.map(version => {
    const name = version[0];
    types[name] = 'area-spline';
    colors[name] = `rgb(${_colors[_colorIndex].join(',')})`;
    _colorIndex++;
    return name;
  });

  const activeDevicesMetrics = bb.generate({
    bindto: '#active_devices',
    legend: {
      hide: true
    },
    padding: PADDING,
    tooltip: {
      contents: snapcraftGraphTooltip.bind(this, {
        colors: colors,
        showLabels: true
      }, el),
      position: positionTooltip.bind(this, el)
    },
    transition: {
      duration: 0
    },
    point: {
      focus: false,
      show: false
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
        },
        padding: {
          top: 30, bottom: 30
        }
      }
    },
    resize: {
      auto: false
    },
    spline: {
      interpolation: {
        type: 'basis'
      }
    },
    data: {
      colors: colors,
      types: types,
      groups: [
        group
      ],
      x: 'x',
      columns: [days].concat(deviceData)
    },
    onrendered: () => {
      // Because we're modifying the axis with CSS the mask crops the labels
      // We don't need the masks, so here we remove them each render.
      Array.from(
        el.querySelectorAll('clipPath')
      ).forEach(mask => {
        if (mask.id.indexOf('axis') !== -1) {
          mask.remove();
        }
      });
    }
  });

  showGraph(el);

  deviceData.forEach(device => {
    const labelClass = device[0].replace(/\W+/g, '-');
    const area = el.querySelector(`.bb-area-${labelClass}`);
    area.dataset.label = device[0];
  });

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = 0;
      debounce(function () {
        activeDevicesMetrics.resize();
        showGraph(el);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener('resize', resize);

  return activeDevicesMetrics;
}

/* global d3, topojson */

function renderMap(el, snapData) {
  const mapEl = d3.select(el);

  d3.queue()
    .defer(d3.json, "/static/js/world-110m.v1.json")
    .await(ready);

  function render(mapEl, snapData, world) {
    const width = mapEl.property('clientWidth');
    const height = width * 0.5;
    // some offset position center of the map properly
    const offset = width * 0.1;

    const projection = d3.geoNaturalEarth1()
      .scale(width * 0.2)
      .translate([(width / 2), ((height + offset) / 2) ])
      .precision(.1);

    // rotate not to split Asia
    projection.rotate([-10, 0]);

    const path = d3.geoPath()
      .projection(projection);

    // clean up HTML before rendering map
    mapEl.html('');

    const svg = mapEl.append("svg")
      .attr("width", width)
      .attr("height", height);

    const tooltip = mapEl.append("div")
      .attr("class", "snapcraft-territories__tooltip u-no-margin");

    const tooltipMsg = tooltip.append("div")
      .attr("class", "p-tooltip__message");

    const countries = topojson.feature(world, world.objects.countries).features;

    const g = svg.append("g");
    const country = g.selectAll(".snapcraft-territories__country").data(countries);

    country.enter().insert("path")
      .attr("class", countryData => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          return `snapcraft-territories__country snapcraft-territories__country-default`;
        }

        return 'snapcraft-territories__country';
      })
      .attr("style", countryData => {
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData){
          if (countrySnapData.color_rgb) {
            return 'fill: rgb(' + countrySnapData.color_rgb[0]+ ',' + countrySnapData.color_rgb[1]+ ',' + countrySnapData.color_rgb[2]+ ')';
          }
        }
      })
      .attr("d", path)
      .attr("id", function(d) {
        return d.id;
      })
      .attr("title", function(d) {
        return d.properties.name;
      })
      .on("mousemove", countryData => {
        const pos = d3.mouse(mapEl.node());
        const countrySnapData = snapData[countryData.id];

        if (countrySnapData) {
          tooltip
            .style('top', pos[1] + 'px')
            .style('left', pos[0] + 'px')
            .style('display', 'block');

          let content = ['<span class="u-no-margin--top">', countrySnapData.name];
          if (countrySnapData['number_of_users'] !== undefined) {
            content.push(`<br />${countrySnapData['number_of_users']} active devices`);
          }
          content.push('</span>');
          tooltipMsg.html(
            `<span
               class="snapcraft-territories__swatch"
               style="background-color: rgb(${countrySnapData.color_rgb[0]}, ${countrySnapData.color_rgb[1]}, ${countrySnapData.color_rgb[2]})"></span>
             ${content.join(' ')}`
          );
        }
      })
      .on("mouseout", function() {
        tooltip.style('display', 'none');
      });

    g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) {
        return a !== b;
      }))
      .attr("class", "snapcraft-territories__boundary")
      .attr("d", path);
  }

  function ready(error, world) {
    render(mapEl, snapData, world);

    let resizeTimeout;

    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        render(mapEl, snapData, world);
      }, 100);
    });
  }
}

var territoriesMetrics = function (el, data) {
  renderMap(el, data);
};

/* globals d3 bb moment */

/**
 * Render all metrics
 * @param {Object} metrics An object of metrics from the API.
 */
function renderMetrics(metrics) {
  if (!d3 || !bb) {
    return false;
  }

  // Active devices
  let activeDevices$$1 = {
    series: [],
    buckets: metrics.activeDevices.metrics.buckets
  };
  metrics.activeDevices.metrics.series.forEach(series => {
    let fullSeries = series.values.map(value => {
      return value === null ? 0 : value;
    });
    fullSeries.unshift(series.name);
    activeDevices$$1.series.push(fullSeries);
  });

  activeDevices$$1.buckets = activeDevices$$1.buckets.map(bucket => {
    return moment(bucket);
  });
  activeDevices$$1.buckets.unshift('x');

  activeDevices(
    activeDevices$$1.buckets,
    activeDevices$$1.series,
    metrics.activeDevices.type
  );

  // Territories
  territoriesMetrics('#territories', metrics.territories);
}

function selector(selector, name) {
  const dropDown = document.querySelector(selector);

  function onChange() {
    let params = new URLSearchParams(window.location.search);

    params.set(name, this.value);

    window.location.search = params.toString();
  }

  dropDown.addEventListener('change', onChange);
}

function openLightbox(url, images) {
  const lightboxEl = initLightboxEl(images);

  openLightboxEl(lightboxEl, url, images);
}

const lightboxTpl = `
  <div class="vbox-preloader">Loading...</div>
  <div class="vbox-container">
    <div class="vbox-content">
      <img class="figlio" >
    </div>
  </div>

  <div class="vbox-title" style="display: none;"></div>
  <div class="vbox-num" style="display: none;">0/0</div>
  <div class="vbox-close">X</div>
  <button class="vbox-next">next</button>
  <button class="vbox-prev">prev</button>
`;

const initLightboxEl = () => {
  const lightboxEl = document.createElement('div');
  lightboxEl.className = 'vbox-overlay';
  lightboxEl.style.display = 'none';
  lightboxEl.style.display = '0';
  lightboxEl.innerHTML = lightboxTpl;

  // adjust positioning when image loads
  const contentEl = lightboxEl.querySelector('.vbox-content');
  const lightboxImgEl = lightboxEl.querySelector('.vbox-content img');

  lightboxImgEl.addEventListener('load', () => {
    contentEl.style.opacity = "1";
  });

  const closeLightbox = (event) => {
    event.preventDefault();
    closeLightboxEl(lightboxEl);
  };

  lightboxEl.querySelector('.vbox-close').addEventListener('click', closeLightbox);
  lightboxEl.addEventListener('click', (event) => {
    const ignore = [
      'figlio',
      'vbox-next',
      'vbox-prev'
    ];
    // This assumes a single class on each item
    if (ignore.indexOf(event.target.className) < 0){
      closeLightbox(event);
    }
  });

  return lightboxEl;
};

const loadLightboxImage = (lightboxEl, url, images) => {
  // hide content before it loads
  lightboxEl.querySelector('.vbox-content').style.opacity = "0";

  // load image
  lightboxEl.querySelector('.vbox-content img').src = url;

  // update prev/next buttons
  if (images && images.length) {
    const imageIndex = images.indexOf(url);

    if (imageIndex > 0) {
      lightboxEl.querySelector('.vbox-prev').removeAttribute('disabled');
      lightboxEl.querySelector('.vbox-prev').dataset.url = images[imageIndex - 1];
    } else {
      lightboxEl.querySelector('.vbox-prev').setAttribute('disabled', 'disabled');
      lightboxEl.querySelector('.vbox-prev').dataset.url = null;
    }

    if (imageIndex < images.length-1) {
      lightboxEl.querySelector('.vbox-next').removeAttribute('disabled');
      lightboxEl.querySelector('.vbox-next').dataset.url = images[imageIndex + 1];
    } else {
      lightboxEl.querySelector('.vbox-next').setAttribute('disabled', 'disabled');
      lightboxEl.querySelector('.vbox-next').dataset.url = null;
    }
  }
};

const openLightboxEl = (lightboxEl, url, images) => {
  // prepare navigating to next/prev images
  if (images && images.length) {
    const handleNextPrevClick = (event) => {
      event.preventDefault();
      if (event.target.dataset.url) {
        loadLightboxImage(lightboxEl, event.target.dataset.url, images);
      }
    };

    const handleNextPrevKey = (event) => {
      const KEYS = {
        ESC: 27,
        LEFT: 37,
        RIGHT: 39
      };
      let image;
      switch(event.keyCode) {
        case KEYS.ESC:
          closeLightboxEl(lightboxEl);
          break;
        case KEYS.LEFT:
          image = lightboxEl.querySelector('.vbox-prev').dataset.url;
          if (image !== 'null') {
            loadLightboxImage(
              lightboxEl,
              image,
              images
            );
          }
          break;
        case KEYS.RIGHT:
          image = lightboxEl.querySelector('.vbox-next').dataset.url;
          if (image !== 'null') {
            loadLightboxImage(
              lightboxEl,
              image,
              images
            );
          }
          break;
      }
    };

    lightboxEl.querySelector('.vbox-next').addEventListener('click', handleNextPrevClick);
    lightboxEl.querySelector('.vbox-prev').addEventListener('click', handleNextPrevClick);
    window.addEventListener('keyup', handleNextPrevKey);
  }

  // open lightbox
  document.body.classList.add('vbox-open');
  document.body.appendChild(lightboxEl);
  lightboxEl.style.opacity = '1';
  lightboxEl.style.display = 'block';

  // load image
  loadLightboxImage(lightboxEl, url, images);
};

const closeLightboxEl = (lightboxEl) => {
  lightboxEl.style.opacity = '0';
  lightboxEl.style.display = 'none';
  if (lightboxEl.parentNode) {
    lightboxEl.parentNode.removeChild(lightboxEl);
  }
  document.body.classList.remove('vbox-open');
};

const lightbox = {
  openLightbox
};

function initSnapIconEdit(iconElId, iconInputId) {
  const snapIconInput = document.getElementById(iconInputId);
  const snapIconEl = document.getElementById(iconElId);

  snapIconInput.addEventListener("change", function(){
    const fileList = this.files;
    snapIconEl.src = URL.createObjectURL(fileList[0]);
  });

  snapIconEl.addEventListener("click", function() {
    snapIconInput.click();
  });
}

function initSnapScreenshotsEdit(screenshotsToolbarElId, screenshotsWrapperElId, screenshotsStatusElId, initialState) {
  // DOM elements
  const screenshotsToolbarEl = document.getElementById(screenshotsToolbarElId);
  const screenshotsWrapper = document.getElementById(screenshotsWrapperElId);
  const screenshotsStatus = document.getElementById(screenshotsStatusElId);

  // simple state handling (and serializing as JSON in hidden input)
  const state = {};
  const stateInput = document.createElement('input');
  stateInput.type = "hidden";
  stateInput.name = "state";

  screenshotsToolbarEl.parentNode.appendChild(stateInput);

  const setState = function(nextState) {
    if (nextState) {
      for (let key in nextState) {
        if (nextState.hasOwnProperty(key)) {
          state[key] = nextState[key];
        }
      }
    }

    let newState = Object.assign({}, state);
    newState.images = newState.images.filter(image => image.status !== 'delete');
    stateInput.value = JSON.stringify(newState);
  };

  setState(initialState);

  // actions on state
  const addScreenshots = (files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setState({
        images: state.images.concat([{
          file, url: URL.createObjectURL(file),
          name: file.name,
          type: "screenshot",
          status: "new"
        }])
      });
    }
  };

  const deleteScreenshot = (screenshot) => {
    if (screenshot.status === 'new') {
      const index = state.images.findIndex(image => image.selected);
      state.images.splice(index, 1);
    } else {
      screenshot._previousStatus = screenshot.status;
      screenshot.status = 'delete';
    }

    setState();
  };

  const selectScreenshot = (url) => {
    state.images.forEach(image => image.selected = false);

    const screenshot = state.images.filter(image => image.url === url)[0];

    if (url && screenshot && screenshot.status !== 'delete') {
      screenshot.selected = true;
    }
  };

  // templates
  const screenshotTpl = (screenshot) => `
    <div class="col-2">
      <div class="p-screenshot__holder ${screenshot.status === 'delete' ? 'is-deleted' : ''}">
        <img
          class="p-screenshot ${screenshot.selected ? 'selected' : ''}"
          src="${screenshot.url}"
          alt=""
        />
      </div>
    </div>
  `;

  const emptyTpl = () => `
    <div class="col-12">
      <a class="p-empty-add-screenshots js-add-screenshots">Add images</a>
    </div>
  `;

  const changesTpl = (newCount, deleteCount) => {
    if (!newCount && !deleteCount) {
      return '';
    }
    return `<p>
      ${newCount
          ? newCount + ' image' + (newCount > 1 ? 's' : '') + ' to upload. '
          : ''}
      ${deleteCount
          ? deleteCount + ' image' + (deleteCount > 1 ? 's' : '') + ' to delete.'
          : ''}
    </p>`;
  };

  const renderScreenshots = (screenshots) => {
    if (screenshots.length) {
      screenshotsWrapper.innerHTML = screenshots.map(screenshotTpl).join("");
    } else {
      screenshotsWrapper.innerHTML = emptyTpl();
    }
  };

  const render = () => {
    const screenshots = state.images.filter(image => image.type === 'screenshot');
    renderScreenshots(screenshots);

    if (screenshots.length === 5) {
      document.querySelector('.js-add-screenshots').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-add-screenshots').removeAttribute('disabled');
    }

    if (screenshots.filter(image => image.selected).length === 0) {
      document.querySelector('.js-delete-screenshot').setAttribute('disabled', 'disabled');
    } else {
      document.querySelector('.js-delete-screenshot').removeAttribute('disabled');
    }

    const newScreenshots = screenshots.filter(image => image.status === 'new').length;
    const deleteScreenshots = screenshots.filter(image => image.status === 'delete').length;
    screenshotsStatus.innerHTML = changesTpl(newScreenshots, deleteScreenshots);
  };

  render();

  const onScreenshotsChange = function() {
    addScreenshots(this.files);
    render();
  };

  // delegated click handlers
  document.addEventListener("click", function(event){
    // Delete screenshot
    if (event.target.classList.contains('js-delete-screenshot')
        || event.target.parentNode.classList.contains('js-delete-screenshot')
       ) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];
      if (screenshot) {
        deleteScreenshot(screenshot);
        selectScreenshot();
      }
      render();
    } else if (event.target.classList.contains('js-fullscreen-screenshot')
        || (event.target.parentNode && event.target.parentNode.classList.contains('js-fullscreen-screenshot'))
      ) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      // if none is selected pick first screenshot from list
      if (!screenshot) {
        screenshot = state.images.filter(image => image.type === 'screenshot')[0];
      }

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    } else {
      // unselect any screenshots when clicked outside of them
      selectScreenshot();
    }

    // clicking on [+] add screenshots button
    if (event.target.classList.contains('js-add-screenshots')
        || event.target.parentNode.classList.contains('js-add-screenshots')
      ) {
      event.preventDefault();

      const input = document.createElement('input');
      input.type = "file";
      input.multiple = "multiple";
      input.accept = "image/*";
      input.name="screenshots";
      input.hidden = "hidden";

      screenshotsToolbarEl.parentNode.appendChild(input);
      input.addEventListener("change", onScreenshotsChange);
      input.click();
    }

    // clicking on screenshot to select it
    if (event.target.classList.contains('p-screenshot')) {
      event.preventDefault();
      selectScreenshot(event.target.src);
      setTimeout(() => {
        render();
      }, 50);
      return;
    }

    render();
  });

  document.addEventListener('dblclick', event => {
    if (event.target.classList.contains('p-screenshot')) {
      event.preventDefault();
      let screenshot = state.images.filter(image => image.selected)[0];

      if (screenshot) {
        lightbox.openLightbox(
          screenshot.url,
          state.images.filter(image => image.type === 'screenshot').map(image => image.url)
        );
      }
    }
  });
}

function initFormNotification(formElId, notificationElId) {
  var form = document.getElementById(formElId);

  form.addEventListener("change", function() {
    var notification = document.getElementById(notificationElId);

    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  var notification = document.getElementById(notificationElId);

  if (notification) {
    setTimeout(function(){
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 20000);
  }
}

const market = {
  initSnapIconEdit,
  initFormNotification,
  initSnapScreenshotsEdit
};

exports.metrics = renderMetrics;
exports.selector = selector;
exports.market = market;

return exports;

}({}));
//# sourceMappingURL=publisher.js.map
