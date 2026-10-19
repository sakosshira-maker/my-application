"use client";
import React from "react";
import * as Lucide from "lucide-react";
import { X } from "lucide-react";
import { sfx } from "@/lib/sound";

export function Icon({ name, size = 20, color, className }: { name: string; size?: number; color?: string; className?: string }) {
  const Cmp = (Lucide as any)[name] || Lucide.BookOpen;
  return <Cmp size={size} color={color} className={className} />;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-[#5b3a5e]/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`cute-card anim-pop w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto p-5 relative`} onClick={(e) => e.stopPropagation()}>
        <div className="washi absolute -top-1 left-1/2 -translate-x-1/2 w-28 h-5 bg-pink-300/70 rotate-[-2deg] rounded-sm" />
        <div className="flex items-center justify-between mb-4 mt-2">
          <h3 className="font-display font-bold text-lg text-[#8a4b7c]">{title}</h3>
          <button onClick={() => { sfx.pop(); onClose(); }} className="cute-btn bg-pink-100 text-pink-500 p-1.5" aria-label="Fermer"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CuteButton({ children, onClick, className = "", type }: { children: React.ReactNode; onClick?: () => void; className?: string; type?: "submit" | "button" }) {
  return (
    <button type={type || "button"} onClick={() => { sfx.pop(); onClick?.(); }}
      className={`cute-btn inline-flex items-center gap-2 px-4 py-2 font-bold text-sm ${className}`}>
      {children}
    </button>
  );
}

export function EmptyState({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-pink-50 border-2 border-dashed border-pink-200 flex items-center justify-center anim-floaty">
        <Icon name={icon} size={28} color="#e598b8" />
      </div>
      <p className="mt-3 font-bold text-[#8a6d9e]">{text}</p>
      {sub && <p className="text-sm text-[#b49cc4] mt-1">{sub}</p>}
    </div>
  );
}

/** Cute bunny study companion (SVG) that grows accessories with level */
export function Pet({ level, size = 120 }: { level: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="anim-floaty drop-shadow-lg" role="img" aria-label="Compagnon d'étude">
      {/* ears */}
      <ellipse cx="72" cy="42" rx="14" ry="36" fill="#ffe3ef" stroke="#e598b8" strokeWidth="3" transform="rotate(-10 72 42)" />
      <ellipse cx="72" cy="46" rx="7" ry="24" fill="#ffb3d1" transform="rotate(-10 72 46)" />
      <ellipse cx="128" cy="42" rx="14" ry="36" fill="#ffe3ef" stroke="#e598b8" strokeWidth="3" transform="rotate(10 128 42)" />
      <ellipse cx="128" cy="46" rx="7" ry="24" fill="#ffb3d1" transform="rotate(10 128 46)" />
      {/* body */}
      <ellipse cx="100" cy="150" rx="46" ry="38" fill="#fff5f9" stroke="#e598b8" strokeWidth="3" />
      {/* head */}
      <circle cx="100" cy="98" r="48" fill="#fff5f9" stroke="#e598b8" strokeWidth="3" />
      {/* cheeks */}
      <ellipse cx="66" cy="112" rx="10" ry="6" fill="#ffc2d9" opacity=".9" />
      <ellipse cx="134" cy="112" rx="10" ry="6" fill="#ffc2d9" opacity=".9" />
      {/* eyes */}
      <circle cx="84" cy="96" r="5.5" fill="#5b3a5e" />
      <circle cx="116" cy="96" r="5.5" fill="#5b3a5e" />
      <circle cx="86" cy="94" r="1.8" fill="#fff" />
      <circle cx="118" cy="94" r="1.8" fill="#fff" />
      {/* nose + mouth */}
      <path d="M96 108 Q100 105 104 108 Q100 113 96 108Z" fill="#ff7bac" />
      <path d="M100 112 Q100 118 93 118 M100 112 Q100 118 107 118" stroke="#5b3a5e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* bow */}
      <g transform="translate(140 58) rotate(18)">
        <path d="M0 0 L-16 -9 Q-20 0 -16 9 Z" fill="#ff7bac" />
        <path d="M0 0 L16 -9 Q20 0 16 9 Z" fill="#ff7bac" />
        <circle cx="0" cy="0" r="5" fill="#d14d7e" />
      </g>
      {/* scarf from level 2 */}
      {level >= 2 && <path d="M62 132 Q100 148 138 132 L138 144 Q100 160 62 144Z" fill="#c9b6ff" stroke="#9b7ede" strokeWidth="2" />}
      {/* book from level 3 */}
      {level >= 3 && (
        <g transform="translate(100 166)">
          <path d="M0 0 Q-18 -8 -30 -4 L-30 14 Q-18 10 0 16 Q18 10 30 14 L30 -4 Q18 -8 0 0Z" fill="#fff" stroke="#9b7ede" strokeWidth="2.5" />
          <path d="M0 0 L0 16" stroke="#9b7ede" strokeWidth="2" />
          <path d="M-24 2 Q-12 -1 -5 3 M5 3 Q12 -1 24 2" stroke="#d9c9f5" strokeWidth="2" fill="none" />
        </g>
      )}
      {/* glasses from level 4 */}
      {level >= 4 && (
        <g stroke="#8a4b7c" strokeWidth="2.6" fill="none">
          <circle cx="84" cy="96" r="13" />
          <circle cx="116" cy="96" r="13" />
          <path d="M97 96 L103 96 M71 94 L56 88 M129 94 L144 88" />
        </g>
      )}
      {/* graduation cap level 5 */}
      {level >= 5 && (
        <g transform="translate(100 52)">
          <path d="M-34 0 L0 -13 L34 0 L0 13Z" fill="#5b3a5e" />
          <path d="M-16 5 L-16 15 Q0 23 16 15 L16 5 L0 12Z" fill="#7a5290" />
          <path d="M34 0 L34 16" stroke="#f6b93b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="34" cy="19" r="4" fill="#f6b93b" />
        </g>
      )}
    </svg>
  );
}

/** Achievement tree that grows with points */
export function Tree({ points }: { points: number }) {
  const stage = points >= 500 ? 5 : points >= 320 ? 4 : points >= 180 ? 3 : points >= 80 ? 2 : points >= 20 ? 1 : 0;
  const leaves: [number, number, number, string][] = [
    [100, 52, 26, "#ffb3d1"], [66, 76, 22, "#ffc2d9"], [134, 76, 22, "#ff9ec7"],
    [82, 96, 20, "#ffd6e8"], [118, 96, 20, "#ffb3d1"], [100, 86, 24, "#ff8fb8"],
    [52, 100, 16, "#ffc2d9"], [148, 100, 16, "#ffd6e8"], [100, 34, 16, "#ff9ec7"],
  ];
  return (
    <svg viewBox="0 0 200 210" className="w-full max-w-[240px] mx-auto" role="img" aria-label="Arbre des réussites">
      <ellipse cx="100" cy="198" rx="64" ry="9" fill="#d8f5d0" />
      {stage === 0 && (<g><path d="M100 196 Q98 182 92 176" stroke="#7bc47f" strokeWidth="4" fill="none" strokeLinecap="round" /><ellipse cx="90" cy="173" rx="8" ry="5" fill="#9ed69a" transform="rotate(-30 90 173)" /><ellipse cx="104" cy="180" rx="7" ry="4.5" fill="#b5e3b0" transform="rotate(25 104 180)" /></g>)}
      {stage >= 1 && (
        <g>
          <path d="M94 198 Q96 160 100 128 Q104 160 106 198Z" fill="#b08850" />
          <path d="M100 150 Q82 138 70 124 M100 142 Q120 130 130 114" stroke="#b08850" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
      )}
      {stage >= 2 && leaves.slice(0, 3 + stage).map(([x, y, r, c], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} opacity=".92" />
      ))}
      {stage >= 4 && ([[78, 70], [122, 62], [100, 96], [140, 92], [62, 94]] as [number, number][]).map(([x, y], i) => (
        <g key={i}><circle cx={x} cy={y} r="5" fill="#fff" /><circle cx={x} cy={y} r="2.2" fill="#f6b93b" /></g>
      ))}
      {stage >= 5 && (<g><path d="M100 16 l3.5 7 7.5 1 -5.5 5.2 1.4 7.5 -6.9 -3.7 -6.9 3.7 1.4 -7.5 -5.5 -5.2 7.5 -1Z" fill="#f6b93b" stroke="#e09f2c" /></g>)}
      {stage >= 1 && stage < 2 && leaves.slice(0, 2).map(([x, y, r, c], i) => <circle key={i} cx={x} cy={y + 30} r={r - 6} fill={c} opacity=".9" />)}
    </svg>
  );
}
