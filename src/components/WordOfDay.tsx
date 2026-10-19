"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, BookHeart } from "lucide-react";
import { wordForDate } from "@/lib/study-catalog";
import { localDay, type SavedWord } from "@/lib/study-types";
import { readListCache, studyRequest } from "@/lib/study-client";
import { sfx } from "@/lib/sound";
export default function WordOfDay({ onSaved }: { onSaved?: () => void } = {}) {
  const [day, setDay] = useState<string | null>(null), [saved, setSaved] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { const update = () => setDay(localDay()); update(); const t = setInterval(update, 60000); return () => clearInterval(t); }, []);
  const word = day ? wordForDate(day) : null;
  const [words, setWords] = useState<SavedWord[]>([]);
  useEffect(() => {
    const cached = readListCache<SavedWord[]>("words", []);
    if (cached.length) setWords(cached);
    studyRequest<SavedWord[]>("words").then(setWords).catch(() => {});
  }, []);
  useEffect(() => { if (!word) return; setSaved(words.some((r) => r.slug === word.slug)); }, [words, word?.slug]);
  if (!word) return null;
  const save = async () => {
    setBusy(true); setError("");
    try { await studyRequest("words", "POST", { slug: word.slug }); setSaved(true); onSaved?.(); sfx.sparkle(); } catch (e) { setError(e instanceof Error ? e.message : "Impossible de garder ce mot."); }
    finally { setBusy(false); }
  };
  return <section className="relative rounded-3xl border-2 border-[#f5d9e9] bg-gradient-to-r from-[#fffaf3] via-white to-[#fff2f8] p-4 sm:p-5">
    <div className="flex gap-3 sm:gap-5 items-start flex-wrap"><span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#fff0f6] border border-pink-100 text-3xl text-[#c37cab] font-hand-fr">𝒬</span><div className="flex-1 min-w-[180px]"><p className="text-[10px] uppercase tracking-widest font-bold text-[#b58da5]">Le mot du jour · {word.category}</p><h2 className="font-display font-bold text-xl text-[#805075] mt-1">{word.term}</h2><p className="text-xs sm:text-sm text-[#8a6d9e] mt-1 leading-relaxed">{word.definition}</p><p className="font-hand-fr text-lg text-[#a777a9] mt-1">{word.example}</p></div><div className="flex flex-col gap-2"><button disabled={busy || saved} onClick={save} className="cute-btn bg-pink-100 text-[#a6537f] px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-65">{saved ? <Check size={14} /> : <BookmarkPlus size={14} />}{saved ? "Dans mon dictionnaire" : busy ? "Je le garde…" : "Garder ce petit mot"}</button><Link href="/dictionnaire" className="text-[11px] text-[#ab7eaa] font-bold flex items-center gap-1.5 justify-center"><BookHeart size={13} /> Mon dictionnaire rose</Link></div></div>{error && <p role="alert" className="text-xs text-rose-500 mt-2">{error}</p>}
  </section>;
}
