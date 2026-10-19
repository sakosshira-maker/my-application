"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, NotebookPen } from "lucide-react";
import type { AppData } from "@/lib/app";
import { apiCreate, apiDelete, apiUpdate } from "@/lib/api";
import { loadAll } from "@/lib/loadAll";
import { ProgressProvider, useProgress } from "@/lib/ProgressContext";
import ModulePage from "@/components/module-page";

export default function ModuleRoute() {
  return (
    <ProgressProvider>
      <ModuleScreen />
    </ProgressProvider>
  );
}

function ModuleScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addPoints } = useProgress();
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await loadAll());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (resource: string, body: Record<string, unknown>) => {
    const row = await apiCreate(resource, body);
    await refresh();
    return row;
  }, [refresh]);

  const update = useCallback(async (resource: string, id: number, body: Record<string, unknown>) => {
    const row = await apiUpdate(resource, id, body);
    await refresh();
    return row;
  }, [refresh]);

  const remove = useCallback(async (resource: string, id: number) => {
    await apiDelete(resource, id);
    await refresh();
  }, [refresh]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-[Baloo_2] text-lg font-bold text-[#C2255C]">Impossible de charger ce cahier.</p>
        <Link href="/" className="btn-cute bg-[#C2255C] px-4 py-2 text-sm font-bold text-white">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <svg width="110" height="110" viewBox="0 0 24 24" className="heart-beat drop-shadow-lg" role="img" aria-label="Chargement du cahier">
          <defs>
            <linearGradient id="beatHeart" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffb3d1" />
              <stop offset="100%" stopColor="#e86ba0" />
            </linearGradient>
          </defs>
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.2 1.7-2 3.2-3.2 5.3-3.2 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="url(#beatHeart)" stroke="#fff" strokeWidth="0.8" />
          <ellipse cx="8" cy="8.6" rx="1.6" ry="1" fill="#fff" opacity=".6" />
        </svg>
        <p className="font-[Baloo_2] font-bold text-[#8A4B7C]">J'ouvre ton cahier…</p>
      </div>
    );
  }

  const moduleId = Number(params?.id);
  const module = data.modules.find((m) => m.id === moduleId);

  if (!module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <NotebookPen size={40} className="text-[#C4A8D4]" />
        <p className="font-[Baloo_2] text-lg font-bold text-[#8A4B7C]">Cette matière n'existe plus.</p>
        <Link href="/" className="btn-cute bg-[#C2255C] px-4 py-2 text-sm font-bold text-white">
          <ArrowLeft size={14} className="inline" /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7FB] px-3 py-4 sm:px-5">
      <div className="mx-auto max-w-[1400px]">
        <ModulePage
          module={module}
          data={data}
          onBack={() => router.push("/")}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
          addPoints={addPoints}
        />
      </div>
    </div>
  );
}
