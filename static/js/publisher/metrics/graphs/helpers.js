function cullXAxis() {
  let frequency = 7;
  let tick, totalTicks, monthCache;

  const ticks = document.querySelectorAll(".axis--x .tick");

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    const text = ticks[tick].querySelector("text");
    const line = ticks[tick].querySelector("line");

    if (tick % frequency !== 0 && ticks.length > 7) {
      text.style.display = "none";
      line.setAttribute("y2", "8");
    } else {
      ticks[tick].classList.add("active");
      text.setAttribute("fill", "#000");
      line.setAttribute("y2", "16");

      const month = text.innerHTML.split(/(\s+)/);
      if (month[0] === monthCache) {
        text.innerHTML = month[month.length - 1];
      }
      monthCache = month[0];
    }
  }
}

function cullYAxis() {
  let frequency = 5;
  let tick, totalTicks;

  const ticks = document.querySelectorAll(".axis--y .tick");

  for (tick = 0, totalTicks = ticks.length; tick < totalTicks; tick += 1) {
    const text = ticks[tick].querySelector("text");
    const line = ticks[tick].querySelector("line");

    if (tick % frequency !== 0) {
      text.style.display = "none";
      line.setAttribute("x2", "-8");
    } else {
      ticks[tick].classList.add("active");
      text.setAttribute("x", "-22");
      line.setAttribute("x2", "-16");
    }
  }
}

export { cullXAxis, cullYAxis };
