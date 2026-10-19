"use client";
import { useEffect, useId, useRef, useState } from "react";
import { X, Move } from "lucide-react";
import { petLevel, PET_PHRASES } from "@/lib/app";
import { useProgress } from "@/lib/ProgressContext";
import { sfx } from "@/lib/sound";

const PET_SIZE = 86;
const STORAGE_KEY = "lina-pet-pos";

export default function StudyPet() {
  const { points } = useProgress();
  const level = petLevel(points);
  const [bubble, setBubble] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const prevPoints = useRef(points);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // position déplaçable — par défaut en bas à gauche
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const speak = (text: string, chime = false) => {
    setBubble(text);
    setBurst(true);
    if (chime) sfx.magic(); else sfx.sparkle();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setBubble(null), 7000);
    setTimeout(() => setBurst(false), 1400);
  };

  // position initiale : bas-gauche, ou position sauvegardée
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.x === "number" && typeof saved.y === "number") {
          setPos({
            x: Math.min(Math.max(0, saved.x), window.innerWidth - 110),
            y: Math.min(Math.max(0, saved.y), window.innerHeight - 120),
          });
          return;
        }
      }
    } catch {}
    setPos({ x: 14, y: window.innerHeight - 130 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // garder le compagnon visible après redimensionnement
  useEffect(() => {
    const onResize = () => {
      setPos((p) => {
        if (!p) return p;
        return {
          x: Math.min(Math.max(0, p.x), window.innerWidth - 110),
          y: Math.min(Math.max(0, p.y), window.innerHeight - 120),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => speak("Bonjour ! Je suis Hajiba, ta compagne d'étude. Déplace-moi où tu veux ! 🐱💕"), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (points > prevPoints.current) {
      prevPoints.current = points;
      speak(PET_PHRASES[Math.floor(Math.random() * PET_PHRASES.length)], true);
    }
  }, [points]);

  useEffect(() => {
    const receive = (event: Event) => {
      const message = (event as CustomEvent<unknown>).detail;
      if (typeof message === "string" && message.length <= 1500) speak(message);
    };
    window.addEventListener("lina:message", receive);
    return () => window.removeEventListener("lina:message", receive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) {
      setPos({
        x: Math.min(Math.max(0, d.origX + dx), window.innerWidth - 110),
        y: Math.min(Math.max(0, d.origY + dy), window.innerHeight - 120),
      });
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (!d.moved) {
      // simple clic → Hajiba parle
      speak(PET_PHRASES[Math.floor(Math.random() * PET_PHRASES.length)]);
    } else if (pos) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
    }
  };

  if (!pos) return null;

  return (
    <div
      ref={boxRef}
      className="fixed z-40 flex items-end gap-2 select-none"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
    >
      {bubble && (
        <div
          className="anim-pop relative max-w-[230px] rounded-3xl rounded-bl-md border-2 border-[#FFB3D1] bg-white/95 p-3 shadow-xl backdrop-blur"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setBubble(null)}
            className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF8FB8] text-[11px] font-bold text-white"
            aria-label="Fermer"
          >
            <X size={11} />
          </button>
          <p className="text-[12px] font-bold leading-snug text-[#8A4B7C]" dir="auto">{bubble}</p>
          <p className="mt-1 flex items-center gap-1 text-[9.5px] font-bold text-[#C4A8D4]">
            <span>🐱</span> Hajiba · ta compagne d'étude
          </p>
        </div>
      )}

      <div className="relative flex flex-col items-center">
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
          aria-label="Parler à Hajiba — glisse-moi où tu veux"
          title="Glisse-moi où tu veux ! · Hajiba"
          style={{ touchAction: "none" }}
        >
          <CatFace size={PET_SIZE} talking={burst} level={level} />
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#FF8FB8] to-[#B79CED] px-2 py-[1px] text-[8px] font-extrabold text-white shadow pointer-events-none">
            Hajiba · niv. {level}
          </span>
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 border border-[#FFD6E8] shadow-sm pointer-events-none">
            <Move size={11} className="text-[#D9A6C6]" />
          </span>
        </button>
        <span className="mt-2 text-[9px] font-bold text-[#D9A6C6] pointer-events-none">glisse-moi ✦</span>
      </div>
    </div>
  );
}

/** Petit chat pastel : fourrure soyeuse, yeux brillants et nœud rose, sans cadre. */
export function CatFace({ size = 86, talking = false, level = 1 }: { size?: number; talking?: boolean; level?: number }) {
  const id = useId();
  const paint = (name: string) => `url(#${id}-${name})`;

  return (
    <svg width={size} height={size} viewBox="0 0 240 240" className="drop-shadow-xl overflow-visible" role="img" aria-label="Hajiba, le petit chat pastel">
      <defs>
        <radialGradient id={`${id}-fur`} cx="45%" cy="33%" r="76%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#fff6fa" />
          <stop offset="84%" stopColor="#ffe8f3" />
          <stop offset="100%" stopColor="#e9d8ed" />
        </radialGradient>
        <linearGradient id={`${id}-ear`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#f6b0d2" />
          <stop offset="60%" stopColor="#ffd1e5" />
          <stop offset="100%" stopColor="#ffe8f3" />
        </linearGradient>
        <radialGradient id={`${id}-eye`} cx="42%" cy="30%" r="76%">
          <stop offset="0%" stopColor="#83658f" />
          <stop offset="48%" stopColor="#4a3357" />
          <stop offset="100%" stopColor="#2c1d38" />
        </radialGradient>
        <linearGradient id={`${id}-iris`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8d70a8" stopOpacity="0" />
          <stop offset="100%" stopColor="#d7a5d8" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id={`${id}-blush`}>
          <stop offset="0%" stopColor="#ff9ec4" stopOpacity="0.85" />
          <stop offset="65%" stopColor="#ffb9d6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffb9d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffbfdb" />
          <stop offset="55%" stopColor="#ff8fb8" />
          <stop offset="100%" stopColor="#e879aa" />
        </linearGradient>
        <radialGradient id={`${id}-nose`} cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffb2cf" />
          <stop offset="100%" stopColor="#e970a4" />
        </radialGradient>
      </defs>

      {/* La même petite poussière de magie lorsque Hajiba parle. */}
      {talking && (
        <g style={{ animation: "twinkle 1.1s ease-in-out 1" }}>
          <path d="M119 25 l3 8 8 1 -6 6 2 8 -7 -4 -7 4 2 -8 -6 -6 8 -1 z" fill="#ffd36e" />
          <path d="M213 88 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="#c9b6ff" />
          <path d="M22 101 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#ffd1e5" />
          <circle cx="85" cy="48" r="3" fill="#cdeffd" />
          <circle cx="159" cy="39" r="3.5" fill="#ffc2e0" />
        </g>
      )}

      {/* Silhouette continue : oreilles pointues arrondies et joues duveteuses. */}
      <path
        d="M75 81
           C63 62 48 39 40 42
           C31 46 38 95 44 115
           C36 125 30 140 31 150 L39 148
           C33 157 31 165 36 173 L44 171
           C51 197 83 213 120 213
           C157 213 189 197 196 171 L204 173
           C209 165 207 157 201 148 L209 150
           C210 140 204 125 196 115
           C202 95 209 46 200 42
           C192 39 177 62 165 81
           C151 75 137 72 120 72
           C103 72 89 75 75 81 Z"
        fill={paint("fur")} stroke="#e9b2cf" strokeWidth="3" strokeLinejoin="round"
      />

      {/* Velours rose à l'intérieur des oreilles. */}
      <path d="M49 58 Q59 62 78 90 Q60 96 49 111 Q42 82 46 64 Q47 59 49 58 Z" fill={paint("ear")} />
      <path d="M191 58 Q181 62 162 90 Q180 96 191 111 Q198 82 194 64 Q193 59 191 58 Z" fill={paint("ear")} />
      <path d="M48 104 Q53 94 55 100 L59 92 L62 99 L68 93 L72 99" fill="#fff6fa" />
      <path d="M192 104 Q187 94 185 100 L181 92 L178 99 L172 93 L168 99" fill="#fff6fa" />
      <path d="M48 67 Q48 78 51 85 M192 67 Q192 78 189 85" stroke="#fff4fa" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.75" />

      {/* Mèche souple et petites marques nacrées sur le front. */}
      <path d="M103 77 Q108 65 118 62 Q113 71 119 74 Q128 65 136 69 Q130 73 130 78" fill={paint("fur")} stroke="#e9b2cf" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 88 Q112 100 120 107 Q128 100 128 88 Q121 92 120 96 Q119 92 112 88 Z" fill="#f1e2f3" opacity="0.65" />
      <path d="M98 91 Q95 100 101 104 M142 91 Q145 100 139 104" stroke="#f6e5f0" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Fleur miniature et ruban de satin, dans le même thème pastel. */}
      <g transform="translate(65 101) rotate(-12)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="0" cy="-6" rx="4" ry="6" fill="#ffe1ee" stroke="#efb4ce" strokeWidth="0.8" transform={`rotate(${r})`} />
        ))}
        <circle r="3.3" fill="#f6ce76" />
        <circle cx="-1" cy="-1" r="1" fill="#fff7d9" />
      </g>
      <g transform="translate(173 91) rotate(18)">
        <path d="M-3 4 L-17 23 L-18 15 L-26 16 L-12 1 M3 4 L14 23 L18 15 L25 17 L12 1" fill={paint("ribbon")} stroke="#e996b7" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M0 0 C-12 -14 -29 -14 -29 -1 C-29 12 -13 14 0 3 Z" fill={paint("ribbon")} stroke="#e58db1" strokeWidth="1.8" />
        <path d="M0 0 C12 -14 29 -14 29 -1 C29 12 13 14 0 3 Z" fill={paint("ribbon")} stroke="#e58db1" strokeWidth="1.8" />
        <path d="M-22 -5 Q-15 -7 -7 -1 M22 -5 Q15 -7 7 -1" stroke="#ffe4f0" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M-18 5 L-7 2 M18 5 L7 2" stroke="#dd6d9c" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <ellipse cy="1" rx="6.5" ry="7.5" fill="#ffbad7" stroke="#e58db1" strokeWidth="1.5" />
        <ellipse cx="-1.5" cy="-1.5" rx="1.7" ry="2.4" fill="#fff2f8" opacity="0.9" />
      </g>

      {/* Joues rosées et museau crème. */}
      <ellipse cx="64" cy="166" rx="20" ry="13" fill={paint("blush")} />
      <ellipse cx="176" cy="166" rx="20" ry="13" fill={paint("blush")} />
      <ellipse cx="108" cy="177" rx="17" ry="12" fill="#ffffff" opacity="0.78" />
      <ellipse cx="132" cy="177" rx="17" ry="12" fill="#ffffff" opacity="0.78" />
      <path d="M56 164 l2 -3 M62 166 l2 -3 M178 166 l-2 -3 M184 164 l-2 -3" stroke="#eaa0bf" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />

      {/* Grands yeux de chat, reflets lavande et pupilles veloutées. */}
      {[86, 154].map((cx) => (
        <g key={cx} transform={`translate(${cx} 145)`}>
          <ellipse rx="16" ry="20" fill={paint("eye")} />
          <path d="M-12 5 Q0 16 12 5 Q10 18 0 18 Q-10 18 -12 5 Z" fill={paint("iris")} />
          <ellipse cy="-1" rx="4.8" ry="13" fill="#2c1d38" opacity="0.5" />
          <circle cx="-5" cy="-7" r="5.5" fill="#ffffff" />
          <circle cx="6" cy="6" r="2.7" fill="#fff8fd" />
          <circle cx="-4" cy="13" r="1.4" fill="#ffd2e7" opacity="0.9" />
          <path d="M-13 -12 Q-4 -23 7 -16" stroke="#715269" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      ))}
      <g stroke="#8a5a74" strokeWidth="2.3" strokeLinecap="round" fill="none">
        <path d="M73 131 Q65 130 62 125 M77 127 Q70 123 69 119" />
        <path d="M167 131 Q175 130 178 125 M163 127 Q170 123 171 119" />
      </g>

      {/* Nez rose, sourire de chat et petite langue quand elle parle. */}
      <path d="M113 169 Q113 166 120 167 Q127 166 127 169 Q124 176 120 176 Q116 176 113 169 Z" fill={paint("nose")} stroke="#dd86ab" strokeWidth="1.2" />
      <path d="M116 169 Q119 168 122 169" stroke="#ffe6f2" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {talking ? (
        <g>
          <path d="M112 181 Q120 184 128 181 Q128 194 120 195 Q112 194 112 181 Z" fill="#8f5674" />
          <path d="M114 190 Q120 186 126 190 Q124 195 120 195 Q116 195 114 190 Z" fill="#f3a6c7" />
          <path d="M120 176 L120 181" stroke="#8a5a74" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : (
        <path d="M120 176 L120 181 M120 181 Q113 190 106 183 M120 181 Q127 190 134 183" stroke="#8a5a74" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      )}

      {/* Longues moustaches fines, bien lisibles même à petite taille. */}
      <g stroke="#b899b7" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" fill="none">
        <path d="M70 168 Q43 160 19 162 M69 175 Q43 175 15 179 M72 182 Q48 188 29 197" />
        <path d="M170 168 Q197 160 221 162 M171 175 Q197 175 225 179 M168 182 Q192 188 211 197" />
      </g>
      <g fill="#d8b3c8" opacity="0.7">
        <circle cx="102" cy="173" r="1.2" /><circle cx="99" cy="178" r="1" />
        <circle cx="138" cy="173" r="1.2" /><circle cx="141" cy="178" r="1" />
      </g>

      {level >= 3 && (
        <path d="M177 169 l1.6 4 4.2 .4 -3.2 2.8 1 4.2 -3.6 -2.2 -3.6 2.2 1 -4.2 -3.2 -2.8 4.2 -.4 z" fill="#ffd36e" stroke="#e8bd62" strokeWidth="0.6" />
      )}
    </svg>
  );
}
