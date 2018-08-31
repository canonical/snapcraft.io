import moment from 'moment';

import mouse from '../../libs/mouse';

function commaNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function standariseOSName(os) {
  return os.replace('/',' ');
}

function generateSeriesMarkup(point, color, highlight) {
  let series = [];
  color = color || 'transparent';
  let extraClass = highlight === point.name ? ' is-hovered' : '';
  series.push(`<span class="snapcraft-graph-tooltip__series${extraClass}" title="${point.name}">`);
  series.push(`<span class="snapcraft-graph-tooltip__series-name">${standariseOSName(point.name)}</span>`);
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

export { snapcraftGraphTooltip, positionTooltip };
