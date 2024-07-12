interface CallableFunction {
  apply<T, R>(thisArg: T, args: IArguments): R;
}

export default function debounce(
  func: CallableFunction,
  wait: number,
  immediate?: boolean
): { (this: HTMLElement): void; clear(): void } {
  let timeout: ReturnType<typeof setTimeout> | null;

  const debounced = function (this: HTMLElement) {
    const context = this;
    const args = arguments;
    let later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };

  debounced.clear = function () {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return debounced;
}
