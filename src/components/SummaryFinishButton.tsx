"use client";
import { useEffect, useState } from "react";
import { Feather, Check, Loader2 } from "lucide-react";
import { studyRequest, tellLina } from "@/lib/study-client";
export default function SummaryFinishButton({ pageId, content, save }: { pageId: number; content: string; save: () => Promise<unknown> }) {
  const [done, setDone] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { let active = true; studyRequest<{ summaries: number[] }>("activity").then((r) => { if (active) setDone(r.summaries.includes(pageId)); }).catch(() => {}); return () => { active = false; }; }, [pageId]);
  const finish = async () => {
    if (content.trim().length < 40) { setError("Écris au moins 40 caractères pour terminer ce résumé."); return; }
    setBusy(true); setError("");
    try { await save(); await studyRequest("activity", "POST", { kind: "summary", pageId }); setDone(true); tellLina("Un résumé de plus dans ton trésor ! Ta Plume d'or se rapproche. Bravo, ma future professeure ! ✨"); } catch (e) { setError(e instanceof Error ? e.message : "Impossible de valider ce résumé."); } finally { setBusy(false); }
  };
  return <div><button disabled={busy || done} onClick={() => void finish()} title="Compte une seule fois pour Plume d'or" className="cute-btn inline-flex gap-1.5 items-center bg-amber-100 text-amber-700 px-3 py-2 font-bold text-xs disabled:opacity-65">{busy ? <Loader2 size={15} className="animate-spin" /> : done ? <Check size={15} /> : <Feather size={15} />}{done ? "Résumé terminé" : busy ? "Enregistrement…" : "Terminer ce résumé"}</button>{error && <p role="alert" className="text-[10px] text-rose-500 mt-1 max-w-60">{error}</p>}</div>;
}
