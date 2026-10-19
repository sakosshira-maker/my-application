let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
  const a = ac(); if (!a || muted) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t); osc.stop(t + dur + 0.05);
}

export const sounds = {
  flip() { tone(340, 0.08, "sine", 0.05); tone(620, 0.09, "sine", 0.16, 0, 980); },
  pop() { tone(620, 0.09, "sine", 0.16, 0, 980); },
  chime() { [659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.28, "sine", 0.14, i * 0.09)); tone(1567.98, 0.4, "triangle", 0.1, 0.38); },
  ding() { tone(1046.5, 0.5, "sine", 0.16); tone(1318.5, 0.6, "sine", 0.12, 0.12); tone(1567.98, 0.8, "triangle", 0.1, 0.24); },
  boop() { tone(240, 0.18, "sine", 0.12, 0, 160); },
  stick() { tone(480, 0.07, "triangle", 0.14); tone(860, 0.06, "sine", 0.08, 0.05); },
};
