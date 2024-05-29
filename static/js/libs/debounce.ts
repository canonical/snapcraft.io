export default function debounce(
  func: Function,
  wait: number,
  immediate?: boolean
) {
  let timeout: any;

  const debounced = function (this: HTMLElement) {
    const context = this;
    const args = arguments;
    let later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };

  debounced.clear = function () {
    clearTimeout(timeout);
  };

  return debounced;
}
