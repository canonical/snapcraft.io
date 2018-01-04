/* globals bb */

import { formatAxis, formatXAxisTickLabels, formatYAxisTickLabels } from '../axis';
import debounce from '../../../libs/debounce';
import { snapcraftGraphTooltip, positionTooltip } from '../tooltips';
import { COLORS, PADDING } from '../config';

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

const labelPosition = function(graphEl, labelText, data, isFirst, isLast) {
  const start = findStart(data);
  const end = findEnd(data);
  const highestIndex = getHighest(data).index;

  const labelClass = labelText.replace('.', '-');
  const area = graphEl.querySelector(`.bb-areas-${labelClass}`);
  const bbox = area.getBBox();
  const sliceWidth = Math.round(bbox.width / data.length);

  const width = sliceWidth * (end - start);
  let leftPadding = (width / 12);
  
  if (isLast && highestIndex > end - 3) {
    leftPadding = -(width / 12);
  }

  const highestLeft = parseInt(
    graphEl.querySelector(`.bb-event-rect-${highestIndex}`).getAttribute('x'),
    10
  );

  let label = document.querySelector(`[data-version="${labelText}"]`);
  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('data-version', labelText);
    label.setAttribute('stroke', '#000');
    label.setAttribute('x', highestLeft + leftPadding);
    label.setAttribute('y', bbox.y + (bbox.height / 2));
    const labelSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    labelSpan.innerHTML = labelText;
    label.appendChild(labelSpan);
    area.appendChild(label);
  } else {
    label.setAttribute('x', highestLeft + leftPadding);
    label.setAttribute('y', bbox.y + (bbox.height / 2));
  }
};

const positionLabels = function(el, activeDevices) {
  activeDevices.forEach((points, index) => {
    let _points = points.slice(0);
    const version = _points.shift();
    labelPosition(el, version, _points, index === 0, index === activeDevices.length - 1);
  });
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
    padding: PADDING,
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