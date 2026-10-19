"use client";
import { useState } from "react";
import { Search, Eye, Check, Trash2, BookHeart } from "lucide-react";
import { FeatureHeading, StatusMessage, useStudyList } from "@/components/study-ui";
import { usePersistentState } from "@/lib/persistence";
import WordOfDay from "@/components/WordOfDay";
import { studyRequest } from "@/lib/study-client";
import type { SavedWord } from "@/lib/study-types";
import { sfx } from "@/lib/sound";
export default function Page() {
  const { items, loading, error, setError, reload } = useStudyList<SavedWord>("words");
  const [search, setSearch] = usePersistentState("dictionary-search", ""), [unlearned, setUnlearned] = usePersistentState("dictionary-todo", false), [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const rows = items.filter((w) => `${w.term} ${w.definition} ${w.category}`.toLowerCase().includes(search.toLowerCase()) && (!unlearned || !w.mastered));
  const mutate = async (id: number, remove: boolean, mastered = false) => {
    if (remove && !confirm("Retirer ce mot de ton dictionnaire ?")) return;
    try { await studyRequest(`words/${id}`, remove ? "DELETE" : "PATCH", remove ? undefined : { mastered }); sfx.pop(); await reload(); } catch (e) { setError(e instanceof Error ? e.message : "Modification impossible."); }
  };
  return <div className="space-y-5"><FeatureHeading icon="BookHeart" eyebrow="des mots précieux à collectionner" title="Mon dictionnaire rose">Les petits mots gardés au fil des jours. Cache la définition, retrouve le sens, puis invente ton propre exemple.</FeatureHeading><WordOfDay onSaved={() => { void reload(); }} /><div className="cute-card p-4 flex items-center gap-3 flex-wrap"><Search size={18} className="text-pink-400" /><input aria-label="Chercher un mot" className="field flex-1 min-w-[180px]" placeholder="Un terme, un thème, une définition…" value={search} onChange={(e) => setSearch(e.target.value)} /><label className="text-xs text-[#96729e] font-bold flex items-center gap-2"><input type="checkbox" checked={unlearned} onChange={(e) => setUnlearned(e.target.checked)} className="accent-pink-400" /> À revoir seulement</label><span className="text-xs text-[#ac87b0]">{items.filter((w) => w.mastered).length} / {items.length} maîtrisés</span></div><StatusMessage error={error} loading={loading} retry={reload} />
    {!loading && !rows.length && <div className="cute-card text-center py-12 px-4"><BookHeart size={40} className="text-pink-300 mx-auto" /><p className="font-display text-lg text-[#8a4b7c] mt-3">{items.length ? "Aucun mot ne correspond à ce filtre." : "Ton dictionnaire attend ses premiers trésors."}</p><p className="text-sm text-[#aa8ab3]">Garde le mot du jour avec le bouton ci-dessus.</p></div>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{rows.map((w) => <article key={w.id} className="cute-card p-5 relative overflow-hidden"><div className="absolute w-12 h-3 bg-pink-100 top-0 left-8 rotate-6" /><p className="text-[10px] uppercase tracking-widest text-[#ad8aba]">{w.category}</p><h2 className="font-display text-xl font-bold text-[#88517e] mt-2">{w.term}</h2><button onClick={() => { sfx.flip(); setRevealed((r) => ({ ...r, [w.id]: !r[w.id] })); }} className="w-full min-h-32 text-left mt-3 rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50/40 p-3 text-sm text-[#92709d]">{revealed[w.id] ? <><span className="block">{w.definition}</span><span className="block mt-2 font-hand-fr text-lg text-[#b16d9b]">{w.example}</span></> : <span className="flex flex-col gap-2 items-center text-center"><Eye size={21} /> Quel est son sens ?<span className="text-xs opacity-70">Clique pour révéler</span></span>}</button><div className="mt-3 flex items-center gap-2"><button onClick={() => void mutate(w.id, false, !w.mastered)} className={`cute-btn px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${w.mastered ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-600"}`}><Check size={13} />{w.mastered ? "Maîtrisé" : "Je le connais"}</button><button className="ms-auto p-2 text-rose-300" onClick={() => void mutate(w.id, true)} aria-label={`Retirer ${w.term}`}><Trash2 size={15} /></button></div></article>)}</div>
  </div>;
}
