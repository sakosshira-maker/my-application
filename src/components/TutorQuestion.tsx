"use client";
import { useState } from "react";
import { MessageCircleQuestion, Send, Loader2 } from "lucide-react";
import { studyRequest } from "@/lib/study-client";
import { sfx } from "@/lib/sound";
export default function TutorQuestion() {
  const [question, setQuestion] = useState(""), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; source: string; question: string } | null>(null);
  const ask = async () => {
    if (!question.trim() || busy) return; setBusy(true); setError("");
    try { const res = await studyRequest<{ answer: string; source: string; question: string }>("tutor", "POST", { question, requestId: crypto.randomUUID() }); setAnswer(res); sfx.sparkle(); } catch (e) { setError(e instanceof Error ? e.message : "Le professeur est indisponible."); } finally { setBusy(false); }
  };
  return <div className="mt-3 pt-3 border-t border-violet-100"><button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-1.5 text-xs font-bold text-[#9b72b6] text-left"><MessageCircleQuestion size={16} /> Une question au professeur ?</button>{open && <form className="mt-2 space-y-2" onSubmit={(e) => { e.preventDefault(); void ask(); }}><textarea aria-label="Ma question au professeur" className="field !text-xs" rows={3} maxLength={2000} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pourquoi le subjonctif après « il faut que » ?" /><button disabled={busy || !question.trim()} className="cute-btn w-full justify-center inline-flex items-center gap-1.5 px-3 py-2 bg-violet-100 text-violet-700 text-xs font-bold disabled:opacity-50" type="submit">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}{busy ? "Je prépare la réponse…" : "Poser ma question"}</button><p className="text-[10px] text-[#b295c0]">Une question envoyée compte pour « Toujours Curieuse ». Les corrections automatiques ne comptent pas.</p>{error && <p role="alert" className="text-xs text-rose-500">{error}</p>}{answer && <div className="p-3 rounded-xl bg-white border border-violet-100"><p className="text-[11px] font-bold text-[#9b72b6]">{answer.question}</p><p className="text-xs text-[#90769b] whitespace-pre-wrap mt-2 leading-relaxed">{answer.answer}</p><p className="text-[9px] text-[#b7a0bf] mt-2">{answer.source}</p></div>}</form>}</div>;
}
