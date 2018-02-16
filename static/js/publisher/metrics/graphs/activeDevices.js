/* globals bb */

import { formatAxis, formatXAxisTickLabels, formatYAxisTickLabels } from '../axis';
import debounce from '../../../libs/debounce';
import { snapcraftGraphTooltip, positionTooltip } from '../tooltips';
import { PADDING } from '../config';
import colorScale from '../colorScale';

function showGraph(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

const findCenter = function(points) {
  const maxValue = Math.max.apply(Math, points);

  let sections = [];
  let cache = [];
  points.forEach((point, index) => {
    if (point / maxValue < 0.5 && cache.length !== 0) {
      sections.push(cache.slice(0));
      cache = [];
    }
    if (point / maxValue >= 0.5) {
      cache.push(index);
    }

    if (index === points.length - 1 && cache.length > 0) {
      sections.push(cache);
    }
  });

  let longestSection = { length: 0 };
  sections.forEach(section => {
    if (section.length > longestSection.length) {
      longestSection = section.slice(0);
    }
  });

  return longestSection;
};

const labelPosition = function(graphEl, labelText, points) {
  const range = findCenter(points);

  const labelClass = labelText.replace(/\W+/g, '-');
  const area = graphEl.querySelector(`.bb-areas-${labelClass}`);
  if (!area) {
    return;
  }
  const bbox = area.getBBox();

  const pointWidth = bbox.width / points.length;
  const left = (pointWidth * range[0]);
  const width = pointWidth * (range[range.length - 1] - range[0]);

  if (bbox.height < 20 || width < 50) {
    return;
  }

  let labelBBox;

  let label = document.querySelector(`[data-version="${labelText}"]`);
  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'snapcraft-metrics__active-devices-label');
    label.setAttribute('data-version', labelText);
    label.setAttribute('stroke', '#000');
    const labelSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    labelSpan.innerHTML = labelText;
    labelSpan.setAttribute('text-anchor', 'middle');
    label.appendChild(labelSpan);
    area.appendChild(label);
    labelBBox = label.getBBox();
  }
  if (labelBBox) {
    label.setAttribute('x', bbox.x + left + (width / 2) + (labelBBox.width / 2));
    label.setAttribute('y', bbox.y + (bbox.height / 2));
  }
};

const positionLabels = function(el, activeDevices) {
  activeDevices.forEach((points) => {
    let _points = points.slice(0);
    const version = _points.shift();
    labelPosition(
      el,
      version,
      _points
    );
  });
};

export default function activeDevices(days, activeDevices, type) {
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
      }),
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
  positionLabels(el, deviceData);

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = 0;
      debounce(function () {
        activeDevicesMetrics.resize();
        showGraph(el);
        positionLabels(el, deviceData);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener('resize', resize);

  return activeDevicesMetrics;
}
