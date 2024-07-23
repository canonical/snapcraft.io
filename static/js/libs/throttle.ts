export default function throttle(
  func: () => unknown,
  wait: number
): () => void {
  let time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      func();
      time = Date.now();
    }
  };
}
