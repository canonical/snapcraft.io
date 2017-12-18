var X_TICK_FREQUENCY = 7;
var Y_TICK_FREQUENCY = 5;

/**
 * Cull Y Axis. The built in culling does not provide enough control.
 *  - hide labels that are not every X_TICK_FREQUENCY ticks.
 *  - remove month abreviation from label for sequential dates that have 
 *    the same month.
 * @param {NodeList} ticks X axis tick elements.
 */
function cullXAxis(ticks) {
  var tick, totalTicks, text, monthCache;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % X_TICK_FREQUENCY !== 0) {
      text.style.display = 'none';
    } else {
      ticks[tick].classList.add('active');
      text.children[0].setAttribute('fill', '#000');
      var month = text.children[0].innerHTML.split(' ');
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
  var tick, totalTicks, text;

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');

    if (tick % Y_TICK_FREQUENCY !== 0) {
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
  console.log(el);
  var xAxis = el.querySelector('.bb-axis-x');

  console.log(xAxis);
  
  var ticks = xAxis.querySelectorAll('.tick');
  cullXAxis(ticks);

  var yAxis = el.querySelector('.bb-axis-y');

  ticks = yAxis.querySelectorAll('.tick');
  cullYAxis(ticks);
}

export {cullXAxis, cullYAxis, formatAxis};