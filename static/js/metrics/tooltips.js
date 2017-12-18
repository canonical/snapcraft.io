/**
 * Generate the tooltip.
 * @param {Object} data The point data.
 * @returns {String} A string of HTML.
 */
function snapcraftGraphTooltip(data) {
  var contents = ['<div class="p-tooltip p-tooltip--top-center">'];
  contents.push('<span class="p-tooltip__message" role="tooltip">');
  contents.push('<span class="snapcraft-graph-tooltip__title">' + moment(data[0].x).format('YYYY-MM-DD') + '</span>');
  data.forEach(function (point) {
    contents.push('<span class="snapcraft-graph-tooltip__series">');
    contents.push('<span class="snapcraft-graph-tooltip__series-name">' + point.name + '</span>');
    contents.push('<span class="snapcraft-graph-tooltip__series-color" style="background: ' + COLORS[point.name] + ';"></span>');
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
function positionTooltip(data, width, height, element) {
  var tooltipHalfWidth = installsMetricsEl
    .querySelector('.p-tooltip__message')
    .clientWidth / 2;
  var elementHalfWidth = parseFloat(element.getAttribute('width')) / 2;
  var elementSixthHeight = parseFloat(element.getAttribute('height')) / 6;
  var leftModifier = -4;
  var parent = element.parentNode;

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
      (mousePosition.y - installsMetricsOffset.top) + window.scrollY - elementSixthHeight
    )
  };
}

export {snapcraftGraphTooltip, positionTooltip};