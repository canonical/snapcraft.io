export default function throttle(func, wait) {
  let time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      func();
      time = Date.now();
    }
  };
}
