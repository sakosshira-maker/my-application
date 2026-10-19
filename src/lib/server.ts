import { getTableColumns } from "drizzle-orm";
import * as s from "@/db/schema";

export const RESOURCES: Record<string, any> = {
  modules: s.modules,
  timetable: s.timetableSlots,
  notebooks: s.notebooks,
  pages: s.pages,
  stickies: s.stickyNotes,
  flashcards: s.flashcards,
  quiz: s.quizQuestions,
  grades: s.grades,
  attachments: s.attachments,
  voice: s.voiceNotes,
  stage: s.stageEntries,
  doubts: s.doubts,
  progress: s.progress,
};

export function clean(table: any, body: Record<string, any>) {
  const cols = getTableColumns(table);
  const out: Record<string, any> = {};
  for (const key of Object.keys(cols)) {
    if (key === "id" || key === "createdAt") continue;
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}
