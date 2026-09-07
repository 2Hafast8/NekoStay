import { useEffect } from "react";

/**
 * Hook to automatically dismiss an alert / notification state after a delay (default 3000ms / 3s).
 *
 * @param {any} value - State value to observe (e.g. errorMsg, successMsg)
 * @param {Function} setter - State setter function
 * @param {number} [delay=3000] - Delay in milliseconds before dismissing
 */
export function useAutoDismiss(value, setter, delay = 3000) {
  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(() => {
      setter(null);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, setter, delay]);
}

