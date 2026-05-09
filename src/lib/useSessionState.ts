import { useEffect, useRef, useState } from "react";

/** Persists state in sessionStorage (cleared when browser tab closes). */
export function useSessionState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw != null) setVal(JSON.parse(raw) as T);
    } catch { /* ignore */ }
    hydrated.current = true;
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
  }, [key, val]);

  return [val, setVal] as const;
}
