/* globals bb */

import { formatAxis, formatXAxisTickLabels, formatYAxisTickLabels } from '../axis';
import debounce from '../../../libs/debounce';
import { snapcraftGraphTooltip, positionTooltip } from '../tooltips';
import { PADDING, COLOR_SCALE } from '../config';

function showGraph(el) {
  formatAxis(el);
  el.style.opacity = 1;
}

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
  let colorScale = COLOR_SCALE.reduce((accumulator, color) => {
    return [].concat(accumulator, color);
  });

  let _colors = [];

  const diff = Math.ceil(deviceData.length / colorScale.length);
  let i = 0;
  while (i < diff) {
    _colors = _colors.concat(colorScale);
    i++;
  }

  let _colorIndex = 0;
  const group = deviceData.map(version => {
    const name = version[0];
    types[name] = 'area-spline';
    colors[name] = `${_colors[_colorIndex]}`;
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
