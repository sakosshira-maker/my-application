import type { OralMetrics } from "./study-types";
export interface CapturedAudio { audioData: string; metrics: OralMetrics }

export async function prepareVoice(blob: Blob): Promise<CapturedAudio> {
  const ctx = new AudioContext();
  let decoded: AudioBuffer;
  try { decoded = await ctx.decodeAudioData(await blob.arrayBuffer()); } finally { await ctx.close(); }
  const duration = Math.min(decoded.duration, 180);
  if (duration < 1) throw new Error("Enregistre au moins une seconde avant de terminer.");
  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.ceil(duration * rate), rate);
  const source = offline.createBufferSource(); source.buffer = decoded; source.connect(offline.destination); source.start();
  const mono = (await offline.startRendering()).getChannelData(0);
  const frame = Math.floor(rate * 0.03);
  let silentFrames = 0, frames = 0, silenceRun = 0, pauses = 0, squares = 0, clipped = 0;
  for (let i = 0; i < mono.length; i++) { squares += mono[i] * mono[i]; if (Math.abs(mono[i]) >= 0.98) clipped++; }
  for (let i = 0; i < mono.length; i += frame) {
    let energy = 0; const count = Math.min(frame, mono.length - i);
    for (let j = 0; j < count; j++) energy += mono[i + j] ** 2;
    const db = 20 * Math.log10(Math.sqrt(energy / count) + 1e-6);
    if (db < -42) { silentFrames++; silenceRun++; }
    else { if (silenceRun * 0.03 >= 0.8) pauses++; silenceRun = 0; }
    frames++;
  }
  if (silenceRun * 0.03 >= 0.8) pauses++;
  const metrics: OralMetrics = { duration: Math.round(duration * 10) / 10, silencePercent: Math.round(silentFrames / frames * 100), longPauses: pauses, rmsDb: Math.max(-120, Math.min(0, Math.round(20 * Math.log10(Math.sqrt(squares / mono.length) + 1e-6)))), clippedPercent: Math.round(clipped / mono.length * 10000) / 100 };
  const buffer = new ArrayBuffer(44 + mono.length * 2); const view = new DataView(buffer);
  const text = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  text(0, "RIFF"); view.setUint32(4, buffer.byteLength - 8, true); text(8, "WAVE"); text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, mono.length * 2, true);
  for (let i = 0; i < mono.length; i++) { const value = Math.max(-1, Math.min(1, mono[i])); view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true); }
  const wav = new Blob([buffer], { type: "audio/wav" });
  const audioData = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Audio illisible.")); reader.readAsDataURL(wav); });
  return { audioData, metrics };
}
