"use client";
import { useEffect, useRef, useState } from "react";
import { CloudRain, Leaf, Pause, Volume2 } from "lucide-react";
import { isMuted, setMuted } from "@/lib/sound";
export default function NaturePlayer() {
  const [mode, setMode] = useState<"rain" | "leaves" | null>(null), [volume, setVolume] = useState(28), [error, setError] = useState("");
  const audio = useRef<AudioContext | null>(null), gain = useRef<GainNode | null>(null), timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    const ctx = audio.current; const node = gain.current; audio.current = null; gain.current = null;
    if (timeout.current) clearTimeout(timeout.current);
    if (ctx) { node?.gain.setTargetAtTime(0, ctx.currentTime, 0.08); setTimeout(() => { void ctx.close().catch(() => {}); }, 250); }
    setMode(null);
  };
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); void audio.current?.close().catch(() => {}); }, []);
  useEffect(() => { const sync = () => { if (audio.current && gain.current) gain.current.gain.setTargetAtTime(isMuted() ? 0 : volume / 100 * 0.16, audio.current.currentTime, 0.1); }; sync(); window.addEventListener("cahier:sound", sync); return () => window.removeEventListener("cahier:sound", sync); }, [volume, mode]);
  const start = async (next: "rain" | "leaves") => {
    if (mode === next) { stop(); return; }
    if (isMuted()) { setError("Le son général est coupé. Réactive-le ci-dessous pour écouter l'ambiance."); return; }
    stop(); setError("");
    try {
      const ctx = new AudioContext(); audio.current = ctx; await ctx.resume();
      if (audio.current !== ctx) { void ctx.close(); return; }
      const samples = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate), data = samples.getChannelData(0);
      let brown = 0;
      for (let i = 0; i < data.length; i++) { const white = Math.random() * 2 - 1; brown = (brown + 0.02 * white) / 1.02; data[i] = next === "rain" ? 0.6 * white + 1.5 * brown : brown * 3.2 + 0.16 * white; }
      const source = ctx.createBufferSource(); source.buffer = samples; source.loop = true;
      const filter = ctx.createBiquadFilter(); filter.type = next === "rain" ? "lowpass" : "bandpass"; filter.frequency.value = next === "rain" ? 1800 : 850; filter.Q.value = 0.45;
      const breathe = ctx.createGain(); breathe.gain.value = 0.8;
      const wave = ctx.createOscillator(); wave.type = "sine"; wave.frequency.value = next === "rain" ? 0.13 : 0.21;
      const depth = ctx.createGain(); depth.gain.value = 0.18; wave.connect(depth).connect(breathe.gain);
      const master = ctx.createGain(); gain.current = master; master.gain.value = 0; master.gain.setTargetAtTime(volume / 100 * 0.16, ctx.currentTime, 0.3);
      source.connect(filter).connect(breathe).connect(master).connect(ctx.destination); source.start(); wave.start(); setMode(next);
      timeout.current = setTimeout(stop, 10 * 60 * 1000);
    } catch { setError("Ton navigateur n'a pas pu démarrer l'ambiance. Réessaie."); stop(); }
  };
  return <section className="cute-card p-5 bg-gradient-to-br from-[#f2fbf5] to-white"><h3 className="font-display font-bold text-[#728f78] flex gap-2 items-center"><Leaf size={19} /> Une petite respiration</h3><p className="text-xs text-[#99a89d] mt-1">Ambiances synthétiques inspirées de la nature, toutes douces. Arrêt automatique après 10 minutes.</p><div className="flex gap-2 mt-4 flex-wrap">{[{ id: "rain" as const, title: "Pluie légère", icon: CloudRain }, { id: "leaves" as const, title: "Feuilles au vent", icon: Leaf }].map((m) => <button key={m.id} onClick={() => void start(m.id)} className={`cute-btn px-3 py-2 text-xs font-bold inline-flex gap-1.5 items-center ${mode === m.id ? "bg-[#87b49a] text-white" : "bg-white text-[#8ca994]"}`}>{mode === m.id ? <Pause size={14} /> : <m.icon size={14} />}{m.title}</button>)}</div><label className="flex items-center gap-3 text-[11px] text-[#91a298] mt-4"><Volume2 size={14} /><input aria-label="Volume des sons naturels" type="range" min={5} max={60} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="accent-[#89b69a] flex-1" />{volume}%</label>{mode && <p role="status" className="text-[11px] text-[#81a18b] mt-2">Laisse tes épaules se relâcher. Tu peux arrêter quand tu veux.</p>}{error && <p role="alert" className="text-xs text-rose-500 mt-2">{error}{isMuted() && <button className="underline ms-2" onClick={() => { setMuted(false); try { localStorage.setItem("petit-cahier-muted", "0"); } catch {} setError(""); }}>Réactiver le son</button>}</p>}</section>;
}
