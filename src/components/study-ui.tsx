"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Flower2, Loader2, RefreshCw } from "lucide-react";
import { usePathname } from "next/navigation";
import { ProgressProvider } from "@/lib/ProgressContext";
import { readListCache, studyRequest } from "@/lib/study-client";
import StudyPet from "./StudyPet";
import { Icon } from "./ui";

export const STUDY_LINKS = [
  { href: "/oral", title: "Expression orale", icon: "Mic", color: "#e3dcff", sub: "Oser parler, apprendre à transmettre." },
  { href: "/bibliotheque", title: "Bibliothèque littéraire", icon: "LibraryBig", color: "#ffe3c2", sub: "Des personnages, des idées, des citations." },
  { href: "/bien-etre", title: "Mon humeur", icon: "Heart", color: "#ffd6e8", sub: "Un espace doux pour souffler." },
  { href: "/reussites", title: "Mes petits exploits", icon: "Award", color: "#d8f5d0", sub: "Des efforts qui deviennent des médailles." },
];
export const actionClass = "cute-btn inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-[#8a4b7c] text-white disabled:opacity-50 disabled:cursor-not-allowed";
export function useStudyList<T>(resource: string) {
  // Your data appears instantly from the last visit, then is refreshed quietly.
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const reload = useCallback(async () => {
    setError("");
    try { setItems(await studyRequest<T[]>(resource)); } catch (e) { setError(e instanceof Error ? e.message : "Chargement impossible."); }
    finally { setLoading(false); }
  }, [resource]);
  useEffect(() => {
    // Show your previous data instantly, then refresh quietly from the server.
    const cached = readListCache<T[]>(resource, []);
    if (cached.length) { setItems(cached); setLoading(false); }
    void reload();
  }, [resource]); // eslint-disable-line react-hooks/exhaustive-deps
  return { items, setItems, loading, error, setError, reload };
}
export function StatusMessage({ error, loading, retry }: { error?: string; loading?: boolean; retry?: () => void }) {
  if (error) return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex gap-3 items-center"><span>{error}</span>{retry && <button onClick={retry} className="underline inline-flex gap-1 items-center"><RefreshCw size={13} /> Réessayer</button>}</div>;
  if (loading) return <p role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-[#8a6d9e]"><Loader2 size={18} className="animate-spin" /> Je prépare ton espace…</p>;
  return null;
}
export function FeatureHeading({ icon, eyebrow, title, children }: { icon: string; eyebrow: string; title: string; children: ReactNode }) {
  return <header className="relative rounded-[28px] border-2 border-pink-100 bg-gradient-to-r from-[#fff0f6] via-[#f5efff] to-[#f0fbf5] p-5 sm:p-7 mb-5 overflow-hidden"><div className="absolute -right-5 -top-5 opacity-10 rotate-12"><Icon name={icon} size={150} color="#b37dba" /></div><div className="relative"><p className="text-[10px] tracking-[.18em] uppercase text-[#a782b3] font-bold mb-2">{eyebrow}</p><h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#6f416d] flex items-center gap-3"><Icon name={icon} size={27} /> {title}</h1><p className="mt-2 text-sm leading-relaxed text-[#8a6d9e] max-w-2xl">{children}</p></div></header>;
}
export function StudyCorners() {
  return <section aria-label="Mes petits ateliers" className="space-y-3"><div className="flex items-baseline gap-2"><h2 className="font-display text-lg font-bold text-[#8a4b7c]">Mes petits ateliers</h2><span className="text-[11px] text-[#ab8bb5]">apprendre · créer · respirer</span></div><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{STUDY_LINKS.map((l) => <Link key={l.href} href={l.href} className="slot-btn rounded-3xl border-2 border-white p-4 text-left" style={{ background: `linear-gradient(130deg,${l.color}90,#fff)` }}><span className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/90 shadow-sm mb-3"><Icon name={l.icon} size={19} color="#8a4b7c" /></span><h3 className="font-display font-bold text-sm text-[#694265]">{l.title}</h3><p className="text-[11px] text-[#9a7fa5] mt-1">{l.sub}</p></Link>)}</div></section>;
}
export function StudyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <ProgressProvider><div className="min-h-screen pb-16"><header className="sticky top-0 z-30 bg-[#fff7fb]/95 backdrop-blur border-b-2 border-pink-100"><div className="max-w-[1250px] mx-auto p-3 flex gap-4 items-center flex-wrap"><Link href="/" className="flex gap-2 items-center font-display font-bold text-[#8a4b7c]"><Flower2 size={23} className="text-pink-400" /> mon petit cahier</Link><nav className="flex gap-1.5 items-center overflow-x-auto ms-auto max-w-full py-1">{[...STUDY_LINKS, { href: "/dictionnaire", title: "Mon dictionnaire", icon: "BookHeart" }].map((l) => <Link key={l.href} href={l.href} className={`shrink-0 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold ${pathname === l.href ? "bg-[#8a4b7c] text-white" : "bg-white text-[#9877a3] hover:bg-pink-50"}`}><Icon name={l.icon} size={13} />{l.title}</Link>)}</nav></div></header><main className="max-w-[1200px] mx-auto px-4 py-5"><Link href="/" className="inline-flex gap-1 items-center text-xs font-bold text-[#a47baa] mb-4"><ArrowLeft size={14} /> Retour à l'accueil</Link>{children}</main><StudyPet /></div></ProgressProvider>;
}
