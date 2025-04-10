export function debounced(fn: () => void, timeout: number) {
    let timer: NodeJS.Timeout | null = null;

    function clearTimer() {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    }

    function run() {
      clearTimer();
      fn();
    }

    return { run, clear: clearTimer };
  }

  export function throttled<Fn extends (...args: any[]) => void>(
    fn: Fn,
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

    function run(...args: Parameters<Fn>) {
      if (counter <= 0) return;
      fn(...args);
      --counter;
      queueResetCounter();
    }

    return { run, clear: clearTimer };
  }
