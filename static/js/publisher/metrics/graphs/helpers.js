function cullXAxis() {
  let frequency = 7, tick, totalTicks, text, monthCache, line;

  const ticks = document.querySelectorAll('.axis--x .tick');

  if (ticks.length > 95) {
    frequency *= 2;
  }

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');
    line = ticks[tick].querySelector('line');

    if (tick % frequency !== 0 && totalTicks > 8) {
      text.style.display = 'none';
      line.setAttribute('y2', '8');
    } else {
      ticks[tick].classList.add('active');
      text.setAttribute('fill', '#000');
      text.setAttribute('y', '22');
      line.setAttribute('y2', '16');

      const month = text.innerHTML.split(' ');
      if (month[0] === monthCache) {
        text.innerHTML = month[1];
      }
      monthCache = month[0];
    }
  }
}

function cullYAxis() {
  let frequency = 5, tick, totalTicks, text, line;

  const ticks = document.querySelectorAll('.axis--y .tick');

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    text = ticks[tick].querySelector('text');
    line = ticks[tick].querySelector('line');

    if (tick % frequency !== 0) {
      text.style.display = 'none';
      line.setAttribute('x2', '-8');
    } else {
      ticks[tick].classList.add('active');
      text.setAttribute('x', '-22');
      line.setAttribute('x2', '-16');
    }
  }
}

export { cullXAxis, cullYAxis };
