"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "petit-cahier:";

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    const probe = `${PREFIX}probe`;
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch { return null; }
}

function read<T>(key: string, fallback: T): T {
  const s = storage();
  if (!s) return fallback;
  try {
    const raw = s.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

/** State that survives a page refresh and a browser restart. */
export function usePersistentState<T>(key: string, initial: T) {
  // The first render matches the server exactly; the remembered value is applied
  // right after hydration, so React never reports a mismatch.
  const [value, setValue] = useState<T>(initial);
  const restored = useRef(false);

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      const stored = read<T | null>(key, null);
      if (stored !== null) setValue(stored);
      return;
    }
    const s = storage();
    if (s) { try { s.setItem(PREFIX + key, JSON.stringify(value)); } catch {} }
  }, [key, value]);

  return [value, setValue] as const;
}

/** Writes immediately instead of on the next render tick (used before unload). */
export function remember<T>(key: string, value: T) {
  const s = storage();
  if (s) { try { s.setItem(PREFIX + key, JSON.stringify(value)); } catch {} }
}

/** Removes a remembered value. */
export function forget(key: string) {
  const s = storage();
  if (s) { try { s.removeItem(PREFIX + key); } catch {} }
}

/**
 * Debounced autosave with a synchronous flush when the tab is hidden or closed,
 * so typed work is never lost even if the user leaves mid-word.
 */
export function useAutosave<T>(key: string, value: T, save: (draft: T) => Promise<void> | void, delay = 1200, enabled = true) {
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const latest = useRef({ key, value, save, enabled });
  latest.current = { key, value, save, enabled };
  const timers = useRef<{ debounce?: ReturnType<typeof setTimeout>; retry?: ReturnType<typeof setTimeout> }>({});
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const lastSaved = useRef<string | null>(null);

  const flush = useCallback(async () => {
    const current = latest.current;
    if (!current.enabled || inFlight.current) return;
    const payload = JSON.stringify(current.value);
    if (!dirty.current && lastSaved.current === payload) return;
    inFlight.current = true;
    setStatus("saving");
    remember(`draft:${current.key}`, current.value);
    try {
      await current.save(current.value);
      dirty.current = false;
      lastSaved.current = payload;
      clearDraftSnapshot(current.key);
      setStatus("saved");
    } catch {
      setStatus("error");
      if (timers.current.retry) clearTimeout(timers.current.retry);
      timers.current.retry = setTimeout(() => { inFlight.current = false; void flush(); }, 6000);
    } finally { inFlight.current = false; }
  }, []);

  // A change is only queued when it truly differs from the last saved content.
  useEffect(() => {
    if (!enabled) { setStatus("idle"); return; }
    const payload = JSON.stringify(value);
    if (lastSaved.current === null) { lastSaved.current = payload; return; }
    if (payload === lastSaved.current) return;
    dirty.current = true;
    setStatus((s) => (s === "error" ? "error" : "pending"));
    remember(`draft:${key}`, value);
    if (timers.current.debounce) clearTimeout(timers.current.debounce);
    timers.current.debounce = setTimeout(() => { void flush(); }, delay);
    return () => { if (timers.current.debounce) clearTimeout(timers.current.debounce); };
  }, [value, delay, enabled, flush, key]);

  // Never lose work: flush as soon as the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        if (timers.current.debounce) clearTimeout(timers.current.debounce);
        void flush();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      if (timers.current.debounce) clearTimeout(timers.current.debounce);
    };
  }, [flush]);

  return { status, flush };
}

/** A snapshot saved while typing, used to recover unsaved work after a crash or refresh. */
export function readDraftSnapshot<T>(key: string): T | null {
  return read<T | null>(`draft:${key}`, null);
}

export function clearDraftSnapshot(key: string) {
  forget(`draft:${key}`);
}
