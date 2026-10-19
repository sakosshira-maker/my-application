// أصوات باستيل فائقة النعومة مولّدة بـ Web Audio API
// لمسات قطنية ناعمة جداً، رنين صندوق موسيقى دافئ، وبدون أي ترددات حادة أو مفاجئة.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lowpass: BiquadFilterNode | null = null;
let muted = false;
let lastBubbleAt = 0;

export function setMuted(m: boolean) {
  muted = m;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cahier:sound"));
}
export function isMuted() { return muted; }

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function output(): AudioNode | null {
  const a = ac();
  if (!a) return null;
  if (!master || master.context !== a) {
    master = a.createGain();
    master.gain.value = 0.52; // مستوى صوت رقيق وناعم، مريح جداً للأذن

    // فلتر حريري يزيل أي حدة أو خشونة نهائياً ويجعل كل الأصوات دافئة ومستديرة
    lowpass = a.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2800;
    lowpass.Q.value = 0.5;

    const compressor = a.createDynamicsCompressor();
    compressor.threshold.value = -30;
    compressor.knee.value = 30;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.25;

    master.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(a.destination);
  }
  return master;
}

function softTone(
  freq: number,
  dur: number,
  vol: number,
  delay = 0,
  slideTo?: number,
  type: OscillatorType = "sine",
) {
  const a = ac();
  const dest = output();
  if (!a || !dest || muted) return;

  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(40, freq), t);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
  }

  // تدرج دخول ناعم جداً (Fade in) لمنع أي "طقطقة" أو صوت فجائي
  gain.gain.setValueAtTime(0.00001, t);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, vol), t + Math.min(0.024, dur * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.00001, t + dur);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.08);
}

/** نغمة صندوق موسيقى رقيقة ودافئة بنقاء كامل */
function softBell(freq: number, delay = 0, dur = 0.38, vol = 0.055) {
  softTone(freq, dur, vol, delay, undefined, "sine");
  // تناغم خفيف جداً وشفاف
  softTone(freq * 2, dur * 0.55, vol * 0.22, delay, undefined, "sine");
}

/** قطرة ماء / فقاعة ناعمة جداً ومخملية */
function softBubble(start = 580, end = 940, delay = 0, vol = 0.045, dur = 0.09) {
  const variation = 0.97 + Math.random() * 0.06;
  softTone(start * variation, dur, vol, delay, end * variation, "sine");
}

function silkWhisper() {
  const a = ac();
  const dest = output();
  if (!a || !dest || muted) return;

  const dur = 0.28;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.sin((i / data.length) * Math.PI);
    // ضوضاء ناعمة مغلّفة كالحرير
    data[i] = (Math.random() * 2 - 1) * env * env * env;
  }

  const src = a.createBufferSource();
  src.buffer = buf;

  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(500, a.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1400, a.currentTime + dur * 0.6);
  filter.frequency.exponentialRampToValueAtTime(750, a.currentTime + dur);

  const gain = a.createGain();
  gain.gain.setValueAtTime(0.00001, a.currentTime);
  gain.gain.linearRampToValueAtTime(0.032, a.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.00001, a.currentTime + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start();
}

export const sfx = {
  /** نقرة فقاعة قطنية ناعمة للغاية ومريحة للأذن عند النقر على أي زر */
  pop() {
    const now = performance.now();
    if (now - lastBubbleAt < 55) return;
    lastBubbleAt = now;
    softBubble(560 + Math.random() * 40, 920, 0, 0.042, 0.085);
  },

  /** جليتر سحري هادئ ورقيق كغبار النجوم المتصاعد */
  magic() {
    [880, 1046.5, 1318.5, 1568].forEach((f, i) => {
      softBell(f, i * 0.065, 0.38, 0.045);
    });
    softTone(2093, 0.42, 0.016, 0.26);
  },

  /** نغمة "Ready Go" باستيل رقيقة وصاعدة بهدوء */
  readyGo() {
    softBubble(523.25, 659.25, 0, 0.045, 0.12);
    softBubble(659.25, 783.99, 0.1, 0.048, 0.12);
    softBell(1046.5, 0.24, 0.42, 0.048);
    softBell(1318.5, 0.36, 0.48, 0.042);
    softTone(1568, 0.55, 0.02, 0.46);
  },

  /** لمعة نجوم هادئة ومريحة عند كلام لينا */
  sparkle() {
    softBell(1174.66, 0, 0.32, 0.038);
    softBell(1479.98, 0.08, 0.35, 0.032);
    softBell(1760, 0.17, 0.42, 0.024);
  },

  /** تقليب صفحة حريري ناعم جداً كأوراق دفتر باستيل */
  flip() {
    silkWhisper();
    softTone(880, 0.18, 0.012, 0.1, 1174.66);
  },

  /** لحن نجاح دافئ ورقيق كصندوق موسيقى كلاسيكي */
  chime() {
    [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => {
      softBell(f, i * 0.085, 0.48, 0.048);
    });
    softBell(1568, 0.38, 0.62, 0.032);
  },

  /** إجابة خاطئة ناعمة ولطيفة جداً بدون أي إزعاج */
  boop() {
    softBubble(349.23, 293.66, 0, 0.034, 0.13);
    softBubble(293.66, 220, 0.09, 0.028, 0.15);
  },

  /** رنين إبريق الشاي الناعم عند اكتمال البومودورو */
  ding() {
    softBell(1046.5, 0, 0.75, 0.052);
    softBell(1318.5, 0.08, 0.82, 0.042);
    softBell(1568, 0.18, 0.88, 0.032);
    softTone(2093, 0.6, 0.014, 0.32);
  },

  /** لصق ملصق: لمسة قطنية ناعمة مع وميض خافت */
  stick() {
    softBubble(440, 680, 0, 0.052, 0.075);
    softBell(1318.5, 0.06, 0.25, 0.028);
  },
};
