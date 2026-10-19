"use client";
import { useEffect, useRef, useState } from "react";
import { GraduationCap, Sparkles, Check, ArrowRightLeft, Wand2, Loader2, BadgeCheck, MessageCircleQuestion, RotateCcw } from "lucide-react";
import { sfx } from "@/lib/sound";
import TutorQuestion from "./TutorQuestion";

interface Correction { wrong: string; right: string; reason: string; start?: number; length?: number; category?: string; ruleId?: string }
interface Result { corrected: string; corrections: Correction[]; encouragement: string; source?: string }

// L'API publique LanguageTool limite le nombre de requêtes : délai assez court pour être réactif,
// mais assez long pour analyser une phrase complète plutôt que chaque frappe.
const DEBOUNCE_MS = 3200;

export default function FrenchTutor({
  getText,
  onApply,
  onDetected,
}: {
  getText: () => string;
  onApply: (corrected: string) => void;
  onDetected?: (corrections: Correction[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [autoCount, setAutoCount] = useState(0);
  const [lastFound, setLastFound] = useState("");
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef("");

  const check = async (text: string, isAuto = false) => {
    if (!text.trim() || text.trim() === lastChecked.current) return;
    lastChecked.current = text.trim();
    if (isAuto) setAutoLoading(true); else setLoading(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data: Result = await res.json();
      setResult(data);
      onDetected?.(data.corrections);
      if (data.corrections.length > 0) {
        setAutoCount((c) => c + 1);
        setLastFound(data.corrections[0].wrong);
        if (isAuto) sfx.boop(); else sfx.sparkle();
      } else if (isAuto) {
        sfx.sparkle();
      }
    } catch {
      if (!isAuto) setError("Je n'ai pas pu vérifier maintenant. Réessaie dans un instant. 💗");
    }
    setAutoLoading(false); setLoading(false);
  };

  // تحليل تلقائي لطيف أثناء الكتابة (بعد توقف قصير)
  useEffect(() => {
    const t = getText();
    if (!t.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void check(t, true); }, DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getText()]);

  const checkNow = () => { void check(getText(), false); };

  const applyAll = () => {
    if (!result) return;
    onApply(result.corrected);
    sfx.magic();
    setResult((r) => (r ? { ...r, corrections: [], encouragement: "C'est appliqué ! Ton texte est tout beau maintenant. ✨" } : r));
  };

  return (
    <div className="rounded-2xl border-2 border-[#E4B8F5] bg-gradient-to-br from-[#FBF2FF] to-white p-3 shadow-sm">
      <button
        onClick={() => { sfx.pop(); setOpen((o) => !o); }}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#E4B8F5] bg-[#F3D9FF]">
          <GraduationCap size={18} color="#6E2F88" />
          {autoCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#C2255C] font-[Baloo_2] text-[9px] font-bold text-white shadow">{autoCount}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 font-[Baloo_2] text-[13px] font-extrabold leading-none text-[#6E2F88]">
            Professeur virtuel
            {autoLoading && <Loader2 size={12} className="animate-spin text-[#C48AEA]" />}
          </span>
          <span className="block text-[10px] font-bold text-[#A678C0]">
            {autoLoading ? "Je surveille ton texte…" : autoCount > 0 ? `Je t'ai aidée ${autoCount} fois · dernier : « ${lastFound.slice(0, 18) }${lastFound.length > 18 ? "…" : ""} »` : "Correcteur strict — je surveille chaque faute"}
          </span>
        </span>
        <Sparkles size={15} className="text-[#C48AEA]" />
      </button>

      {open && (
        <div className="mt-3">
          <div className="flex gap-1.5">
            <button
              onClick={checkNow}
              disabled={loading}
              className="btn-cute flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#C48AEA] to-[#FF8FB8] py-2 font-[Baloo_2] text-sm font-bold text-white shadow disabled:opacity-60"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Je corrige…</> : <><Wand2 size={15} /> Corriger</>}
            </button>
            <button
              onClick={() => { setAutoCount(0); setLastFound(""); sfx.pop(); }}
              className="btn-cute flex items-center justify-center gap-1 rounded-full bg-white border-2 border-[#E4B8F5] px-3 py-2 text-xs font-bold text-[#A678C0]"
              title="Réinitialiser le compteur"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <TutorQuestion />

          {error && <p className="mt-2 rounded-xl bg-[#FFF0F6] px-3 py-2 text-[11px] font-bold text-[#C2255C]">{error}</p>}

          {result && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-[#F0FBF4] px-3 py-2">
                <BadgeCheck size={14} className="shrink-0 text-[#1B7046]" />
                <p className="text-[11px] font-bold leading-snug text-[#1B7046]">{result.encouragement}</p>
              </div>

              {result.corrections.length > 0 ? (
                <>
                  <p className="flex items-center gap-1 text-[10px] font-extrabold text-[#C2255C]">
                    <MessageCircleQuestion size={12} /> {result.corrections.length} correction{result.corrections.length > 1 ? "s" : ""} à regarder
                  </p>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                    {result.corrections.slice(0, 10).map((c, i) => (
                      <div key={i} className="rounded-xl border-2 border-[#F3D9FF] bg-white p-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                          <span className="rounded-md bg-[#FFE3EC] px-1.5 py-0.5 text-[#C2255C] line-through decoration-[#E87BA0]">{c.wrong || "—"}</span>
                          <ArrowRightLeft size={12} className="text-[#C48AEA]" />
                          <span className="rounded-md bg-[#E8FBEF] px-1.5 py-0.5 text-[#1B7046]">{c.right || "—"}</span>
                        </div>
                        {c.reason && <p className="mt-1 text-[10.5px] font-semibold leading-snug text-[#8A6D9E]">💡 {c.reason}</p>}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={applyAll}
                    className="btn-cute flex w-full items-center justify-center gap-1.5 rounded-full bg-[#1E9E63] py-2 font-[Baloo_2] text-sm font-bold text-white shadow"
                  >
                    <Check size={15} /> Tout corriger
                  </button>
                </>
              ) : (
                <p className="flex items-center justify-center gap-1 rounded-xl bg-[#FFFBE6] py-3 text-[11px] font-bold text-[#8A6A12]">
                  <Sparkles size={13} /> Aucune faute trouvée — parfait !
                </p>
              )}
              <p className="text-center text-[9px] font-bold text-[#C4A8D4]">
                {result.source === "local"
                  ? "Vérification locale de secours · connecte le réseau pour l'analyse universitaire complète."
                  : `Analyse universitaire stricte · ${result.source || "LanguageTool"}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
