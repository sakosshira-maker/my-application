"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Trash2 } from "lucide-react";
import { prepareVoice, type CapturedAudio } from "@/lib/voice-capture";

export default function VoiceCapture({ onReady, maxSeconds = 180 }: { onReady: (audio: CapturedAudio | null) => void; maxSeconds?: number }) {
  const [state, setState] = useState<"idle" | "asking" | "recording" | "processing">("idle");
  const [seconds, setSeconds] = useState(0), [audio, setAudio] = useState<string | null>(null), [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null), streamRef = useRef<MediaStream | null>(null), timer = useRef<ReturnType<typeof setInterval> | null>(null), mounted = useRef(true);
  const ready = useRef(onReady); ready.current = onReady;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; if (timer.current) clearInterval(timer.current); if (recorder.current?.state === "recording") recorder.current.stop(); streamRef.current?.getTracks().forEach((t) => t.stop()); }; }, []);
  const stop = () => { if (timer.current) clearInterval(timer.current); if (recorder.current?.state === "recording") { setState("processing"); recorder.current.stop(); } };
  const start = async () => {
    setError(""); setState("asking");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error("Le microphone nécessite un navigateur récent et une connexion HTTPS.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      if (!mounted.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = () => { setError("L'enregistrement a été interrompu. Réessaie."); stop(); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); if (timer.current) clearInterval(timer.current);
        if (!mounted.current) return;
        setState("processing");
        try {
          const result = await prepareVoice(new Blob(chunks, { type: rec.mimeType }));
          if (mounted.current) { setAudio(result.audioData); ready.current(result); }
        } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : "Impossible de préparer cet audio."); }
        finally { if (mounted.current) setState("idle"); }
      };
      setAudio(null); ready.current(null); setSeconds(0); rec.start(250); setState("recording");
      const startTime = Date.now();
      timer.current = setInterval(() => { const elapsed = Math.floor((Date.now() - startTime) / 1000); setSeconds(elapsed); if (elapsed >= maxSeconds) stop(); }, 200);
    } catch (e) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (mounted.current) { setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Accès au microphone refusé. Autorise-le dans ton navigateur, puis réessaie." : e instanceof Error ? e.message : "Microphone indisponible."); setState("idle"); }
    }
  };
  return (
    <div className="rounded-2xl border-2 border-pink-100 bg-pink-50/50 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" disabled={state === "asking" || state === "processing"} onClick={state === "recording" ? stop : start} className={`cute-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-bold ${state === "recording" ? "bg-rose-500 text-white" : "bg-pink-200 text-[#8a4b7c]"} disabled:opacity-50`}>
          {state === "asking" || state === "processing" ? <Loader2 size={17} className="animate-spin" /> : state === "recording" ? <Square size={17} fill="currentColor" /> : <Mic size={17} />}
          {state === "asking" ? "Autorisation du micro…" : state === "processing" ? "Préparation de l'audio…" : state === "recording" ? "Terminer" : audio ? "Recommencer" : "Enregistrer ma voix"}
        </button>
        <span className="tabular-nums text-sm font-bold text-[#8a6d9e]">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} <span className="font-normal text-xs">/ {Math.floor(maxSeconds / 60)} min</span></span>
        {state === "recording" && <span className="flex items-center gap-1.5 text-xs text-rose-500"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Microphone actif</span>}
      </div>
      {audio && <div className="flex items-center gap-2 mt-3"><audio controls src={audio} className="h-9 w-full min-w-0" /><button type="button" onClick={() => { setAudio(null); ready.current(null); setSeconds(0); }} title="Effacer l'essai" className="p-2 text-rose-400"><Trash2 size={16} /></button></div>}
      <p className="text-[11px] text-[#8a6d9e] mt-2">Le micro ne s'active qu'à ta demande. Écoute ton essai avant de le sauvegarder.</p>
      {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
