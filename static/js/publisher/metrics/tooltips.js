/* globals moment */

import mouse from '../../libs/mouse';

function generateSeriesMarkup(point, color) {
  let series = [];
  color = color || 'transparent';
  series.push(`<span class="snapcraft-graph-tooltip__series" title="${point.name}">`);
  series.push(`<span class="snapcraft-graph-tooltip__series-name">${point.name}</span>`);
  series.push(`<span class="snapcraft-graph-tooltip__series-color" style="background:${color};"></span>`);
  series.push(`<span class="snapcraft-graph-tooltip__series-value">${point.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>`);
  series.push('</span>');

  return series.join('');
}

/**
 * Generate the tooltip.
 * @param {Array} colors The colours used for the graph.
 * @param {Object} data The point data.
 * @returns {String} A string of HTML.
 */
function snapcraftGraphTooltip(colors, data) {
  let contents = ['<div class="p-tooltip p-tooltip--top-center">'];
  contents.push('<span class="p-tooltip__message" role="tooltip">');
  contents.push('<span class="snapcraft-graph-tooltip__title">' + moment(data[0].x).format('YYYY-MM-DD') + '</span>');
  let series = [];
  const total = data.reduce((a, b) => {
    return {value: a.value + parseInt(b.value)};
  }).value;
  let other = {
    count: 0,
    value: 0,
    name: 'Other'
  };
  data.forEach((point) => {
    let color = colors[point.name];
    if (point.value === 0) {
      return;
    }
    if (point.value / total < 0.001) {
      other.count += 1;
      other.value += point.value;
      return;
    }
    series.push(generateSeriesMarkup(point, color));
  });
  if (other.count > 0) {
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
 * @param {Object} data The  point data.
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
  let leftModifier = -26;
  const parent = element.parentNode;
  const graphHolderOffsetTop = graphHolder.offsetTop;

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
      (mouse.position.y - graphHolderOffsetTop) + window.scrollY - elementSixthHeight
    )
  };
}

export { snapcraftGraphTooltip, positionTooltip };