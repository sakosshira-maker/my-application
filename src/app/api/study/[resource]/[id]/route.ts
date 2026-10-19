import { eq } from "drizzle-orm";
import { db } from "@/db";
import { literaryBooks, moodEntries, savedWords, oralSessions, lessonPlans } from "@/db/schema";
import { errorResponse, positiveId, readBody, str, StudyError } from "@/lib/study-server";
import { bookValues, planValues } from "@/lib/study-validation";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id: raw } = await params; const id = positiveId(raw); const b = await readBody(req);
    let row;
    if (resource === "books") {
      const values = bookValues(b, true); if (!Object.keys(values).length) throw new StudyError("Aucune modification.");
      [row] = await db.update(literaryBooks).set(values).where(eq(literaryBooks.id, id)).returning();
    } else if (resource === "words") {
      if (typeof b.mastered !== "boolean") throw new StudyError("Valeur invalide.");
      [row] = await db.update(savedWords).set({ mastered: b.mastered }).where(eq(savedWords.id, id)).returning();
    } else if (resource === "plans") {
      [row] = await db.update(lessonPlans).set({ ...planValues(b), updatedAt: new Date() }).where(eq(lessonPlans.id, id)).returning();
    } else if (resource === "oral") {
      [row] = await db.update(oralSessions).set({ transcript: str(b.transcript, "Transcription", 12000), review: null }).where(eq(oralSessions.id, id)).returning();
      if (row) row = { ...row, audioData: `/api/study/audio?resource=oral&id=${id}` };
    } else throw new StudyError("Espace introuvable.", 404);
    if (!row) throw new StudyError("Élément introuvable.", 404);
    return Response.json(row);
  } catch (e) { return errorResponse(e); }
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    const { resource, id: raw } = await params; const id = positiveId(raw);
    const tables = { books: literaryBooks, moods: moodEntries, words: savedWords, oral: oralSessions, plans: lessonPlans };
    const table = tables[resource as keyof typeof tables];
    if (!table) throw new StudyError("Espace introuvable.", 404);
    await db.delete(table).where(eq(table.id, id));
    return Response.json({ ok: true });
  } catch (e) { return errorResponse(e); }
}
