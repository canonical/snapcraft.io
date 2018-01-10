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

  const labelClass = labelText.replace(/\W+/g, '-');
  const area = graphEl.querySelector(`.bb-areas-${labelClass}`);
  const bbox = area.getBBox();

  if (bbox.height < 20) {
    return;
  }

  const sliceWidth = Math.round(bbox.width / data.length);

  const width = sliceWidth * (end - start);
  let leftPadding = width / 12;
  if (isLast && highestIndex > end - 3) {
    //leftPadding = -(width / 12);
  }

  const highestEl = graphEl.querySelector(`.bb-event-rect-${highestIndex}`).getBBox();

  const highestLeft = parseInt(
    highestEl.x + (highestEl.width / 2),
    10
  );

  let label = document.querySelector(`[data-version="${labelText}"]`);
  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'snapcraft-metrics__active-devices-label');
    label.setAttribute('data-version', labelText);
    label.setAttribute('stroke', '#000');
    label.setAttribute('x', highestLeft + leftPadding);
    label.setAttribute('y', bbox.y + (bbox.height / 2));
    const labelSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    labelSpan.innerHTML = labelText;
    labelSpan.setAttribute('text-anchor', 'middle');
    label.appendChild(labelSpan);
    graphEl.children[0].appendChild(label);
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

function getDailyTotals(data) {
  let days = [];

  data.forEach(points => {
    points.shift();

    points.forEach((point, i) => {
      if (!days[i]) {
        days[i] = 0;
      }
      days[i] += point;
    });
  });

  return days;
}

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