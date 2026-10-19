"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, Flower2, Loader2 } from "lucide-react";
import { sfx } from "@/lib/sound";
import { studyRequest } from "@/lib/study-client";
import type { FocusSession } from "@/lib/study-types";

type FocusResponse = { session: FocusSession | null; serverNow: number };
export default function Pomodoro({ onComplete }: { onComplete: (mins: number) => void }) {
  const [mode, setMode] = useState<"focus" | "break">("focus"), [focusMin, setFocusMin] = useState(25), [breakMin, setBreakMin] = useState(5);
  const [session, setSession] = useState<FocusSession | null>(null), [now, setNow] = useState(Date.now()), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [breakLeft, setBreakLeft] = useState(300), [breakEnd, setBreakEnd] = useState<number | null>(null), [breakDone, setBreakDone] = useState(false);
  const callback = useRef(onComplete); callback.current = onComplete;
  const skew = useRef(0), notified = useRef<number | null>(null), observed = useRef<number | null>(null), pending = useRef(false), lastCompleteAttempt = useRef(0);
  const adopt = useCallback((r: FocusResponse) => {
    skew.current = r.serverNow - Date.now(); setNow(Date.now()); setSession(r.session);
    const s = r.session;
    if (s && ["running", "paused"].includes(s.status)) { setFocusMin(s.minutes); observed.current = s.id; }
    if (s?.status === "completed" && notified.current !== s.id) {
      notified.current = s.id;
      if (observed.current === s.id) sfx.ding();
      callback.current(s.minutes);
      window.dispatchEvent(new Event("cahier:activity"));
    }
  }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const r = await studyRequest<FocusResponse>("focus"); if (active) { adopt(r); setError(""); } }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Minuteur indisponible."); }
      finally { if (active) setReady(true); }
    };
    void load(); window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener("focus", load); };
  }, [adopt]);
  const action = useCallback(async (type: string) => {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError("");
    try { adopt(await studyRequest<FocusResponse>("focus", "POST", { action: type, id: session?.id, minutes: focusMin })); return true; }
    catch (e) { setError(e instanceof Error ? e.message : "Impossible de modifier le minuteur."); return false; }
    finally { pending.current = false; setBusy(false); }
  }, [adopt, focusMin, session?.id]);
  const focusActive = session && ["running", "paused"].includes(session.status);
  const focusRunning = session?.status === "running";
  useEffect(() => { if (!focusRunning && !breakEnd) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [focusRunning, breakEnd]);
  const focusSeconds = session?.status === "running" && session.endsAt ? Math.max(0, Math.ceil((Date.parse(session.endsAt) - now - skew.current) / 1000)) : session?.status === "paused" ? session.remainingSeconds : session?.status === "completed" ? 0 : focusMin * 60;
  const restSeconds = breakEnd ? Math.max(0, Math.ceil((breakEnd - now) / 1000)) : breakLeft;
  useEffect(() => {
    if (focusRunning && focusSeconds === 0 && !pending.current && Date.now() - lastCompleteAttempt.current > 1500) { lastCompleteAttempt.current = Date.now(); void action("complete"); }
  }, [now, focusRunning, focusSeconds, action]);
  useEffect(() => { if (breakEnd && restSeconds === 0) { setBreakEnd(null); setBreakLeft(0); setBreakDone(true); sfx.ding(); } }, [breakEnd, restSeconds]);
  const running = mode === "focus" ? focusRunning : Boolean(breakEnd);
  const done = mode === "focus" ? session?.status === "completed" : breakDone;
  const total = (mode === "focus" ? (focusActive ? session.minutes : focusMin) : breakMin) * 60;
  const seconds = mode === "focus" ? focusSeconds : restSeconds;
  const progress = done ? 1 : Math.max(0, Math.min(1, 1 - seconds / total));
  const switchMode = async (next: "focus" | "break") => {
    if (next === mode || busy) return;
    if (mode === "focus" && focusRunning && !(await action("pause"))) return;
    if (mode === "break" && breakEnd) { setBreakLeft(restSeconds); setBreakEnd(null); }
    setMode(next); sfx.pop();
  };
  const toggle = async () => {
    if (mode === "focus") {
      const ok = await action(focusRunning ? "pause" : session?.status === "paused" ? "resume" : "start");
      if (ok && !focusRunning) sfx.readyGo();
    } else if (breakEnd) { setBreakLeft(restSeconds); setBreakEnd(null); }
    else { const left = breakLeft || breakMin * 60; setBreakLeft(left); setBreakEnd(Date.now() + left * 1000); setBreakDone(false); setNow(Date.now()); sfx.pop(); }
  };
  const reset = async () => {
    if (mode === "break") { setBreakEnd(null); setBreakLeft(breakMin * 60); setBreakDone(false); return; }
    if (focusActive) { if (!confirm("Abandonner cette séance ? La série de séances consécutives repartira de zéro. Une simple pause ne la coupe pas.")) return; if (!(await action("abandon"))) return; }
    setSession(null); setNow(Date.now());
  };
  return <div className="cute-card p-5 text-center relative overflow-hidden"><div className="washi absolute top-2 right-6 w-20 h-5 bg-violet-300/60 rotate-6 rounded-sm" /><h3 className="font-display font-bold text-[#8a4b7c] flex items-center justify-center gap-2"><Flower2 className="text-pink-400" size={20} /> Mon doux Pomodoro</h3><p className="text-xs text-[#b49cc4] mt-1">Chaque minute fait éclore ta petite fleur.</p>
    <div className="flex justify-center gap-2 mt-4">{[{ id: "focus" as const, label: "Concentration" }, { id: "break" as const, label: "Pause" }].map((m) => <button key={m.id} disabled={busy} onClick={() => void switchMode(m.id)} className={`cute-btn px-4 py-1.5 text-xs font-bold ${mode === m.id ? (m.id === "focus" ? "bg-pink-400 text-white" : "bg-teal-300 text-white") : "bg-pink-50 text-pink-400"}`}>{m.label}</button>)}</div>
    <div className="relative mx-auto w-44 h-44 mt-3"><svg viewBox="0 0 160 160" className="w-full h-full" style={{ animation: running ? "bloomPulse 3s ease-in-out infinite" : undefined }}><path d="M80 96 Q76 124 80 148" stroke="#7bc47f" strokeWidth="5" fill="none" strokeLinecap="round" /><ellipse cx="64" cy="126" rx="12" ry="6" fill="#9ed69a" transform="rotate(-28 64 126)" /><g transform={`translate(80 76) scale(${0.25 + progress * 0.85})`} style={{ transition: "transform 1s linear" }}>{[0, 60, 120, 180, 240, 300].map((r) => <ellipse key={r} cx="0" cy="-24" rx="13" ry="24" fill={mode === "focus" ? "#ff9ec7" : "#7fdcc3"} opacity=".9" transform={`rotate(${r})`} />)}<circle r="13" fill="#ffe08a" stroke="#f6b93b" strokeWidth="2" /><circle cx="-4" cy="-2" r="1.8" fill="#8a5a3b" /><circle cx="4" cy="-2" r="1.8" fill="#8a5a3b" /><path d="M-4 4 Q0 7 4 4" stroke="#8a5a3b" strokeWidth="1.8" fill="none" strokeLinecap="round" /></g></svg><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white/90 border-2 border-pink-200 rounded-full px-4 py-0.5 font-display font-bold text-xl text-[#8a4b7c] tabular-nums" aria-label="Temps restant">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</div></div>
    <div className="flex items-end justify-center gap-1 mt-2 h-10"><div className="relative">{running && <><span className="steam-line absolute -top-4 right-2 w-1.5 h-4 bg-violet-300/70 rounded-full" /><span className="steam-line absolute -top-4 right-5 w-1.5 h-4 bg-pink-300/70 rounded-full" style={{ animationDelay: ".6s" }} /></>}<Coffee size={26} className="text-[#c08552]" /></div><p className="text-xs text-[#b49cc4]">{done ? (mode === "focus" ? "Bravo ! Ta fleur a éclos !" : "On repart tout doucement ?") : running ? "Ton thé infuse doucement…" : "Prête à te concentrer ?"}</p></div>
    <div className="flex justify-center gap-2 mt-3"><button disabled={busy || !ready} onClick={() => void toggle()} className="cute-btn inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-pink-400 text-white disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : running ? <Pause size={15} /> : <Play size={15} />}{running ? "Suspendre" : seconds < total && !done ? "Reprendre" : "Commencer"}</button><button disabled={busy || !ready} onClick={() => void reset()} className="cute-btn inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-violet-100 text-violet-500"><RotateCcw size={14} /> Repartir</button></div>
    <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-[#8a6d9e]"><label className="flex items-center gap-1">Focus<select disabled={Boolean(focusActive) || busy} className="field !w-auto !py-1 !px-1 !text-xs disabled:opacity-50" value={focusMin} onChange={(e) => { setFocusMin(Number(e.target.value)); setSession(null); }}>{[5, 10, 15, 20, 25, 30, 45, 50].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label><label className="flex items-center gap-1">Repos<select disabled={Boolean(breakEnd)} className="field !w-auto !py-1 !px-1 !text-xs" value={breakMin} onChange={(e) => { setBreakMin(Number(e.target.value)); setBreakLeft(Number(e.target.value) * 60); setBreakDone(false); }}>{[3, 5, 10, 15].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label></div>
    <div className="mt-3 h-3 bg-pink-50 border border-pink-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-l from-pink-300 to-violet-300 rounded-full transition-all duration-1000" style={{ width: `${progress * 100}%` }} /></div><p className="mt-2 text-[10px] text-[#b49cc4]">Séance gardée même en changeant de page. Dès 25 min, elle compte pour « Maître du Temps ».</p>{error && <p role="alert" className="text-xs text-rose-500 mt-2">{error}</p>}
  </div>;
}
