import { useEffect, useState } from "react";

/** Небольшая задержка для демонстрации skeleton-состояний на локальных данных. */
export function useDelayedReady(delay = 420) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timeout);
  }, [delay]);

  return ready;
}
