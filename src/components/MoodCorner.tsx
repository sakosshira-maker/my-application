"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { MOODS } from "@/lib/study-catalog";
import { localDay, type MoodEntry, type MoodKey } from "@/lib/study-types";
import { readListCache, studyRequest, tellLina } from "@/lib/study-client";
export default function MoodCorner() {
  const [mood, setMood] = useState<MoodKey | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  useEffect(() => {
    const cached = readListCache<MoodEntry[]>("moods", []);
    if (cached.length) setMoods(cached);
    studyRequest<MoodEntry[]>("moods").then(setMoods).catch(() => {});
  }, []);
  useEffect(() => { const today = localDay(); setMood(moods.find((r) => r.date === today)?.mood || null); }, [moods]);
  const choose = async (key: MoodKey) => {
    setBusy(true); setError("");
    try { await studyRequest("moods", "POST", { date: localDay(), mood: key }); setMood(key); tellLina(MOODS.find((m) => m.key === key)!.support); } catch (e) { setError(e instanceof Error ? e.message : "Impossible de garder ton humeur."); } finally { setBusy(false); }
  };
  return <section className="cute-card p-4"><div className="flex items-center gap-2"><Heart size={17} className="text-pink-400" /><h2 className="font-display font-bold text-[#8a4b7c]">Comment va ton petit cœur ?</h2></div><p className="text-[11px] text-[#ad8cb7] mt-1">Pas de bonne ou de mauvaise réponse.</p><div className="grid grid-cols-4 gap-1.5 mt-3">{MOODS.map((m) => <button key={m.key} disabled={busy} onClick={() => void choose(m.key)} aria-pressed={mood === m.key} className={`rounded-2xl border-2 px-1 py-2 transition hover:-translate-y-1 ${mood === m.key ? "border-pink-300" : "border-white"}`} style={{ background: m.color }}><span className="text-xl">{m.emoji}</span><span className="block mt-1 text-[9px] font-bold text-[#99769e]">{m.label}</span></button>)}</div>{error && <p className="text-xs text-rose-500 mt-2" role="alert">{error}</p>}<Link href="/bien-etre" className="flex items-center justify-end gap-1 text-[11px] text-[#b482aa] font-bold mt-3">Mon journal & ma pause <ArrowRight size={12} /></Link></section>;
}
