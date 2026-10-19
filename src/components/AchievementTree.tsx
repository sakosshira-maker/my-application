"use client";
import { useEffect, useState } from "react";
import { Sprout, TreePine, Trophy, Sun, Flower2 } from "lucide-react";
import { apiList } from "@/lib/api";
import { Tree } from "@/components/ui";

export default function AchievementTree() {
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setPoints(data.progress?.points ?? 0);
            setHistory((data.progress?.data?.history ?? [] as string[]).slice(-8));
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stage = points >= 500 ? 5 : points >= 320 ? 4 : points >= 180 ? 3 : points >= 80 ? 2 : points >= 20 ? 1 : 0;
  const nextThresholds = [20, 80, 180, 320, 500];
  const next = nextThresholds.find((t) => points < t);
  const pct = next ? Math.min(100, Math.round((points / next) * 100)) : 100;

  return (
    <section className="card-cute p-4 sm:p-5">
      <div className="washi" style={{ background: "#B79CED", top: -10, right: 120, transform: "rotate(8deg)" }} />
      <div className="flex items-center gap-2 mb-3">
        <Sprout size={18} color="#1E7A4C" />
        <h3 className="font-[Baloo_2] text-base font-bold leading-none text-[#5B4A6F]">Arbre des réussites</h3>
      </div>
      <p className="text-[11px] font-bold text-[#B79CED] mb-4">
        Un arbre planté pour chaque temps de travail. Ton bastian grandit avec toi, future professeure.
      </p>

      <div className="h-64 flex items-end justify-center gap-2 px-2">
        {[
          { key: "racine", label: "Racine", pts: 20, icon: <Sprout size={14} color="#8A7BA6" /> },
          { key: "jeune", label: "Jeune arbre", pts: 80, icon: <TreePine size={14} color="#1E7A4C" /> },
          { key: "fleuri", label: "Arbre fleuri", pts: 180, icon: <Flower2 size={14} color="#D6336C" /> },
          { key: "foret", label: "Forêt", pts: 320, icon: <TreePine size={14} color="#156B3A" /> },
          { key: "etoile", label: "Étoile", pts: 500, icon: <Trophy size={14} color="#F6B93B" /> },
        ].map((tree) => {
          const planted = points >= tree.pts;
          return (
            <div key={tree.key} className="flex flex-col items-center gap-1 relative group">
              <div className={`relative w-10 h-10 rounded-full border-2 ${planted ? "bg-emerald-50 border-emerald-200" : "bg-[#FFF7FB] border-[#F3E3EF]"}`}>
                {planted ? tree.icon : <span className="text-[#D6336C] opacity-30">{tree.icon}</span>}
                {!planted && (
                  <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-[#F06595] flex items-center justify-center text-[8px] font-bold text-white">
                    {tree.pts}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-[#8A7BA6] leading-tight">{tree.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] font-bold mb-1">
          <span className="text-[#5B4A6F]">Tes étoiles : {points}</span>
          {next ? <span className="text-[#D6336C]">Prochain arbre : {next} étoiles</span> : <span className="text-[#1E7A4C]">Bastian complet !</span>}
        </div>
        <div className="h-3 bg-[#F3E3EF] rounded-full overflow-hidden border border-[#F0DCEC]">
          <div className={`h-full rounded-full transition-all duration-700 ${points >= 500 ? "bg-gradient-to-r from-emerald-400 to-emerald-300" : "bg-gradient-to-r from-pink-300 to-violet-300"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-4 max-h-32 overflow-y-auto pr-1 space-y-1.5">
        <p className="text-[10px] font-bold text-[#B79CED] mb-1">Dernières plantations</p>
        {history.length === 0 ? (
          <p className="text-[10px] text-[#C4A8D4] text-center italic">Aucune plantation pour le moment.</p>
        ) : (
          history.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-[#FFF7FB] rounded-lg px-2 py-1">
              <Flower2 size={11} color="#D6336C" />
              <span className="text-[10px] font-bold text-[#8A7BA6]" dir="auto">{h}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
