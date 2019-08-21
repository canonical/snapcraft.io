export default function initTour() {
  var overlay = document.querySelector(".p-tour-overlay");
  var overlayMask = document.querySelector(".p-tour-overlay__mask");
  var tooltip = document.querySelector(".p-card--tour");

  var offset = 5;
  function moveOverlay(rect) {
    let top = rect.top - offset;
    if (top < 0) {
      top = 0;
    }

    let left = rect.left - offset;
    if (left < 0) {
      left = 0;
    }

    let bottom = rect.top + rect.height + offset;
    let right = rect.left + rect.width + offset;

    let mask = [
      `${left}px ${top}px`,
      `${left}px ${bottom}px`,
      `${right}px ${bottom}px`,
      `${right}px ${top}px`,
      `${left}px ${top}px`
    ].join(",");

    let clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${mask})`;
    overlayMask.style.webkitClipPath = clipPath;
    overlayMask.style.clipPath = clipPath;
    tooltip.style.left = (left > offset ? left : offset) + "px";
    tooltip.style.top = bottom + "px";
  }

  document.addEventListener("click", function(event) {
    overlay.style.pointerEvents = "none";
    var x = event.clientX,
      y = event.clientY,
      elementMouseIsOver = document.elementFromPoint(x, y);
    overlay.style.pointerEvents = "";

    let clientRect = elementMouseIsOver.getBoundingClientRect();
    let rect = {
      top:
        clientRect.top +
        (window.pageYOffset || document.documentElement.scrollTop),
      left:
        clientRect.left +
        (window.pageXOffset || document.documentElement.scrollLeft),
      width: clientRect.width,
      height: clientRect.height
    };

    moveOverlay(rect);

    event.preventDefault();
    event.stopPropagation();
  });
}
