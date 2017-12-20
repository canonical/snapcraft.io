/* globals bb */

import { formatAxis, formatXAxisTickLabels, formatYAxisTickLabels } from '../axis';
import debounce from '../../libs/debounce';
import { snapcraftGraphTooltip, positionTooltip } from '../tooltips';
import { COLORS } from '../config';

function showGraph(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

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

const labelPosition = function(graphEl, labelText, data) {
  const start = findStart(data);
  const end = findEnd(data);
  const highestIndex = getHighest(data).index;

  const labelClass = labelText.replace('.', '-');
  const area = graphEl.querySelector(`.bb-areas-${labelClass}`);
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

export default function activeDevices(days, activeDevices) {
  const el = document.getElementById('active_devices');

  let types = {};
  let colors = {};
  let _colors = COLORS.activeDevices.slice(0);

  const group = activeDevices.map(version => {
    const name = version[0];
    types[name] = 'area-spline';
    colors[name] = _colors.shift();
    return name;
  });

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
  activeDevices.forEach(points => {
    const version = points.shift();
    labelPosition(el, version, points);
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