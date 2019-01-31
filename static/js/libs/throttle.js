/**
 * Throttle
 * @param {Function} func Function to run.
 * @param {Number} wait Time to wait between tries.
 */

export default function throttle(func, wait) {
  let time = Date.now();
  return function() {
    if (time + wait - Date.now() < 0) {
      func();
      time = Date.now();
    }
  };
}
