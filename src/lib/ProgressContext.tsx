"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { studyRequest } from "./study-client";
interface ProgressState { points: number; pomodoros: number }
interface ProgressCtx extends ProgressState {
  ready: boolean; addPoints: (n: number, reason: string) => void;
  completePomodoro: () => void; refresh: () => Promise<void>;
}
const ProgressContext = createContext<ProgressCtx | null>(null);
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false), [state, setState] = useState<ProgressState>({ points: 0, pomodoros: 0 });
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/progress", { cache: "no-store" });
      if (!res.ok) throw new Error("Chargement des étoiles impossible");
      const rows = await res.json(); const row = rows[0];
      if (row) setState({ points: row.points || 0, pomodoros: row.pomodoros || 0 });
    } catch { /* keep last known progress on transient network failure */ }
    finally { setReady(true); }
  }, []);
  useEffect(() => {
    void refresh(); const listener = () => { void refresh(); };
    window.addEventListener("cahier:activity", listener); window.addEventListener("focus", listener); window.addEventListener("cahier:progress-refresh", listener);
    return () => { window.removeEventListener("cahier:activity", listener); window.removeEventListener("focus", listener); window.removeEventListener("cahier:progress-refresh", listener); };
  }, [refresh]);
  const addPoints = useCallback((n: number, reason: string) => {
    if (n <= 0) return;
    // Server-side increment; concurrent rewards no longer overwrite one another.
    void studyRequest("activity", "POST", { kind: "points", amount: Math.min(20, Math.floor(n)), reason: reason.slice(0, 500), requestId: crypto.randomUUID() }).catch(() => { void refresh(); });
  }, [refresh]);
  const completePomodoro = useCallback(() => { void refresh(); }, [refresh]);
  return <ProgressContext.Provider value={{ ready, ...state, addPoints, completePomodoro, refresh }}>{children}</ProgressContext.Provider>;
}
export function useProgress(): ProgressCtx {
  return useContext(ProgressContext) || { ready: false, points: 0, pomodoros: 0, addPoints: () => {}, completePomodoro: () => {}, refresh: async () => {} };
}
