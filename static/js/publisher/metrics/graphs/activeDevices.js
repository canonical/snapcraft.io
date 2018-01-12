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
  label.setAttribute('x', bbox.x + left + (width / 2) + (labelBBox.width / 2));
  label.setAttribute('y', bbox.y + (bbox.height / 2));
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

export default function activeDevices(days, activeDevices) {
  const el = document.getElementById('active_devices');

  let types = {};
  let colors = {};
  let _colors = colorScale(activeDevices.length);
  let _colorIndex = 0;
  const group = activeDevices.map(version => {
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
      contents: snapcraftGraphTooltip.bind(this, colors),
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
      columns: [days].concat(activeDevices)
    }
  });

  showGraph(el);
  positionLabels(el, activeDevices);

  // Extra events
  let elWidth = el.clientWidth;

  const resize = debounce(function () {
    if (el.clientWidth !== elWidth) {
      el.style.opacity = 0;
      debounce(function () {
        activeDevicesMetrics.resize();
        showGraph(el);
        positionLabels(el, activeDevices);
        elWidth = el.clientWidth;
      }, 100)();
    }
  }, 500);

  window.addEventListener('resize', resize);

  return activeDevicesMetrics;
}