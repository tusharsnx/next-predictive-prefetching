export function debounced<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  timeout: number,
) {
  let timer: NodeJS.Timeout | null = null;

  function clearTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function run(...args: TArgs) {
    clearTimer();
    timer = setTimeout(() => fn(...args), timeout);
  }

  return { run, clear: clearTimer };
}

export function throttled<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  interval: number,
  runs: number,
) {
  let timer: NodeJS.Timeout | null = null;
  let counter = runs;

  function clearTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function queueResetCounter() {
    if (timer) return;
    timer = setTimeout(() => {
      counter = runs;
      timer = null;
    }, interval);
  }

  function run(...args: TArgs) {
    if (counter <= 0) return;
    fn(...args);
    --counter;
    queueResetCounter();
  }

  return { run, clear: clearTimer };
}
