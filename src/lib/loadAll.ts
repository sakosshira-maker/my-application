import type { AppData } from "@/lib/app";
import { apiList } from "@/lib/api";

const LISTS = [
  "modules", "timetable", "notebooks", "pages", "stickies", "flashcards",
  "quiz", "grades", "attachments", "voice", "stage", "doubts", "progress",
] as const;

export async function loadAll(): Promise<AppData> {
  const results = await Promise.all(LISTS.map((r) => apiList<Record<string, unknown>>(r)));
  const map: Record<string, unknown[]> = {};
  LISTS.forEach((key, i) => { map[key] = results[i]; });
  const progressRow = (map.progress?.[0] ?? {}) as { id?: number; points?: number; pomodoros?: number; data?: { history?: string[] } };
  return {
    modules: map.modules as AppData["modules"],
    timetable: map.timetable as AppData["timetable"],
    notebooks: map.notebooks as AppData["notebooks"],
    pages: (map.pages as AppData["pages"]).map((p) => ({ ...p, stickers: Array.isArray(p.stickers) ? p.stickers : [] })),
    stickies: map.stickies as AppData["stickies"],
    flashcards: map.flashcards as AppData["flashcards"],
    quiz: (map.quiz as AppData["quiz"]).map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })),
    grades: map.grades as AppData["grades"],
    attachments: map.attachments as AppData["attachments"],
    voice: map.voice as AppData["voice"],
    stage: map.stage as AppData["stage"],
    doubts: map.doubts as AppData["doubts"],
    progress: {
      id: progressRow.id,
      points: progressRow.points ?? 0,
      pomodoros: progressRow.pomodoros ?? 0,
      data: progressRow.data ?? { history: [] },
    },
  };
}
