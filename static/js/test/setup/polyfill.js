// jsdom (in version that comes with jest) doesn't support .closest
// so we need to polyfill that
// shouldn't be needed when jsdom used by jest is updated to v11.12.0
window.Element.prototype.closest = function(selector) {
  var el = this;
  while (el) {
    if (el.matches(selector)) {
      return el;
    }
    el = el.parentElement;
  }
};
