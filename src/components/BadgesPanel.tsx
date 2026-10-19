"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles, Check } from "lucide-react";
import { Icon } from "./ui";
import type { BadgeState } from "@/lib/study-types";
import { studyRequest, tellLina } from "@/lib/study-client";
import { StatusMessage } from "./study-ui";

export default function BadgesPanel({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<BadgeState | null>(null), [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const state = await studyRequest<BadgeState>("badges"); setData(state); setError("");
      window.dispatchEvent(new Event("cahier:progress-refresh"));
      try {
        const seen: string[] = JSON.parse(localStorage.getItem("cahier:badges-seen") || "[]");
        const fresh = state.badges.find((b) => b.unlockedAt && !seen.includes(b.key));
        if (fresh) tellLina(`Une nouvelle médaille : « ${fresh.title} » ! Tes petits efforts font de grandes choses. ✨`);
        localStorage.setItem("cahier:badges-seen", JSON.stringify(state.badges.filter((b) => b.unlockedAt).map((b) => b.key)));
      } catch { /* storage may be disabled */ }
    } catch (e) { setError(e instanceof Error ? e.message : "Impossible de lire tes médailles."); }
  }, []);
  useEffect(() => { void load(); const listener = () => { void load(); }; window.addEventListener("cahier:activity", listener); window.addEventListener("focus", listener); return () => { window.removeEventListener("cahier:activity", listener); window.removeEventListener("focus", listener); }; }, [load]);
  return <section className={compact ? "cute-card p-4" : "space-y-5"}>
    <div className="flex items-center gap-2 mb-3"><Icon name="Award" size={20} color="#d9a94a" /><h2 className="font-display font-bold text-[#8a4b7c]">Ma boîte à médailles</h2>{compact && <Link href="/reussites" className="ms-auto text-[#b496c2]" aria-label="Toutes les médailles"><ArrowRight size={16} /></Link>}</div>
    <StatusMessage error={error} loading={!data && !error} retry={load} />
    {data && <><div className={compact ? "space-y-2" : "grid md:grid-cols-3 gap-5"}>{data.badges.map((b) => {
      const unlocked = Boolean(b.unlockedAt), pct = Math.min(100, b.current / b.goal * 100);
      return <article key={b.key} className={`relative overflow-hidden ${compact ? "rounded-2xl border p-3" : "cute-card p-6 text-center"} ${unlocked ? "border-amber-200" : "border-dashed border-pink-200"}`} style={{ background: `linear-gradient(145deg,${b.color}${unlocked ? "99" : "50"},white)` }}>
        <div className={compact ? "flex items-center gap-3" : ""}><div className={`${compact ? "w-10 h-10" : "w-24 h-24 mx-auto mb-4"} relative rounded-full flex items-center justify-center border-[3px] border-white shadow-[0_3px_0_#ead6e6] ${unlocked ? "" : "opacity-65"}`} style={{ background: b.color }}><Icon name={b.icon} size={compact ? 20 : 40} color={unlocked ? "#986a37" : "#aa8ab3"} /><span className="absolute -bottom-1 -right-1 rounded-full bg-white p-1">{unlocked ? <Check size={12} className="text-emerald-500" /> : <LockKeyhole size={12} className="text-[#bb9bc2]" />}</span></div><div className="flex-1 min-w-0"><h3 className="font-display font-bold text-[#735070]">{b.title}</h3>{!compact && <p className="text-xs text-[#9b80a6] leading-relaxed min-h-16 mt-2">{b.description}</p>}<p className="text-[11px] text-[#9b80a6] mt-1">{unlocked ? `Obtenu le ${new Date(b.unlockedAt!).toLocaleDateString("fr-FR")}` : `${Math.min(b.current, b.goal)} / ${b.goal}`}</p></div></div>
        <div className="h-2 mt-3 rounded-full bg-white/90 overflow-hidden border border-pink-50"><div className="h-full rounded-full bg-gradient-to-r from-pink-300 to-violet-300 transition-all" style={{ width: `${pct}%` }} /></div>
      </article>;
    })}</div>{!compact && <div className="cute-card p-5 flex gap-3 items-start bg-[#fffdf5]"><Sparkles size={22} className="text-amber-400 shrink-0" /><div><h3 className="font-bold text-[#8a4b7c]">Chaque progrès compte, sans course à la perfection.</h3><p className="text-sm text-[#9b80a6] mt-1">Série actuelle : <b>{data.focusStreak}</b> séance(s) · meilleur enchaînement : <b>{data.focusBest}</b>. Les médailles obtenues restent dans ta collection. Une page n'est comptée qu'une fois ; les corrections automatiques ne fabriquent pas de questions.</p><div className="flex gap-3 flex-wrap text-xs font-bold mt-3"><Link href="/" className="text-[#b4709d] underline">Ouvrir mes cahiers</Link><Link href="/oral" className="text-[#9677bb] underline">M'entraîner à l'oral</Link></div></div></div>}</>}
  </section>;
}
