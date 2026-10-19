"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AppData } from "@/lib/app";
import { apiCreate, apiDelete, apiUpdate } from "@/lib/api";
import { loadAll } from "@/lib/loadAll";
import { ProgressProvider, useProgress } from "@/lib/ProgressContext";
import { DoubtsPage } from "@/components/extras";
import StudyPet from "@/components/StudyPet";

export default function DoutesRoute() {
  return (
    <ProgressProvider>
      <DoutesScreen />
    </ProgressProvider>
  );
}

function DoutesScreen() {
  const [data, setData] = useState<AppData | null>(null);
  const { addPoints } = useProgress();
  const refresh = useCallback(async () => setData(await loadAll()), []);
  useEffect(() => { void refresh(); }, [refresh]);

  const create = async (r: string, b: Record<string, unknown>) => { const row = await apiCreate(r, b); await refresh(); return row; };
  const update = async (r: string, id: number, b: Record<string, unknown>) => { const row = await apiUpdate(r, id, b); await refresh(); return row; };
  const remove = async (r: string, id: number) => { await apiDelete(r, id); await refresh(); };

  return (
    <div className="min-h-screen bg-[#FFF7FB] px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-[1100px]">
        <Link href="/" className="btn-cute mb-3 inline-flex items-center gap-1.5 bg-white px-3 py-1.5 text-xs font-bold text-[#8A4B7C]">
          <ArrowLeft size={14} /> Retour à mon petit cahier
        </Link>
        {!data ? (
          <p className="py-20 text-center font-[Baloo_2] font-bold text-[#B79CED]">Je prépare ta zone des doutes…</p>
        ) : (
          <DoubtsPage data={data} onCreate={create} onUpdate={update} onDelete={remove} addPoints={addPoints} />
        )}
      </div>
      <StudyPet />
    </div>
  );
}
