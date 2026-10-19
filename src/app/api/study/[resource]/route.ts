import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { literaryBooks, moodEntries, savedWords, oralSessions, lessonPlans, studyEvents } from "@/db/schema";
import { DAILY_WORDS, MOODS } from "@/lib/study-catalog";
import { audioData, completeSummary, dateKey, errorResponse, getBadges, num, readBody, recordActivity, seedLiterature, str, StudyError } from "@/lib/study-server";
import { bookValues, oralValues, planValues } from "@/lib/study-validation";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params;
    if (resource === "badges") return Response.json(await getBadges());
    if (resource === "activity") {
      const rows = await db.select({ data: studyEvents.data }).from(studyEvents).where(eq(studyEvents.kind, "summary"));
      return Response.json({ summaries: rows.map((r) => (r.data as { pageId: number }).pageId) });
    }
    if (resource === "books") { await seedLiterature(); return Response.json(await db.select().from(literaryBooks).orderBy(desc(literaryBooks.id))); }
    if (resource === "words") return Response.json(await db.select().from(savedWords).orderBy(desc(savedWords.id)));
    if (resource === "plans") return Response.json(await db.select().from(lessonPlans).orderBy(desc(lessonPlans.updatedAt)));
    if (resource === "oral") {
      const rows = await db.select({ id: oralSessions.id, title: oralSessions.title, kind: oralSessions.kind, reference: oralSessions.reference, transcript: oralSessions.transcript, duration: oralSessions.duration, metrics: oralSessions.metrics, review: oralSessions.review, createdAt: oralSessions.createdAt }).from(oralSessions).orderBy(desc(oralSessions.id));
      return Response.json(rows.map((r) => ({ ...r, audioData: `/api/study/audio?resource=oral&id=${r.id}` })));
    }
    if (resource === "moods") {
      const rows = await db.select({ id: moodEntries.id, date: moodEntries.date, mood: moodEntries.mood, note: moodEntries.note, duration: moodEntries.duration, hasAudio: sql<boolean>`length(${moodEntries.audioData}) > 0`, updatedAt: moodEntries.updatedAt }).from(moodEntries).orderBy(desc(moodEntries.date));
      return Response.json(rows.map((r) => ({ ...r, audioData: r.hasAudio ? `/api/study/audio?resource=moods&id=${r.id}` : "" })));
    }
    throw new StudyError("Espace introuvable.", 404);
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params;
    const b = await readBody(req);
    if (resource === "books") {
      const [row] = await db.insert(literaryBooks).values(bookValues(b) as typeof literaryBooks.$inferInsert).returning();
      return Response.json(row, { status: 201 });
    }
    if (resource === "words") {
      const word = DAILY_WORDS.find((w) => w.slug === b.slug);
      if (!word) throw new StudyError("Mot introuvable.", 404);
      await db.insert(savedWords).values(word).onConflictDoNothing();
      const [row] = await db.select().from(savedWords).where(eq(savedWords.slug, word.slug));
      return Response.json(row, { status: 201 });
    }
    if (resource === "moods") {
      const date = dateKey(b.date);
      if (!MOODS.some((m) => m.key === b.mood)) throw new StudyError("Choisis un des quatre ressentis.");
      const values = { mood: String(b.mood), ...(b.note === undefined ? {} : { note: str(b.note, "Note", 10000) }), ...(b.audioData === undefined ? {} : { audioData: audioData(b.audioData), duration: num(b.duration ?? 0, "Durée", 0, 182) }), updatedAt: new Date() };
      const [row] = await db.insert(moodEntries).values({ date, ...values }).onConflictDoUpdate({ target: moodEntries.date, set: values }).returning();
      return Response.json({ ...row, audioData: row.audioData ? `/api/study/audio?resource=moods&id=${row.id}&v=${Date.now()}` : "" });
    }
    if (resource === "oral") {
      const [row] = await db.insert(oralSessions).values(oralValues(b)).returning();
      return Response.json({ ...row, audioData: `/api/study/audio?resource=oral&id=${row.id}` }, { status: 201 });
    }
    if (resource === "plans") {
      const [row] = await db.insert(lessonPlans).values(planValues(b)).returning();
      return Response.json(row, { status: 201 });
    }
    if (resource === "activity") {
      let recorded = false;
      if (b.kind === "summary") recorded = await completeSummary(num(b.pageId, "Page", 1, Number.MAX_SAFE_INTEGER));
      else if (b.kind === "points") {
        const amount = num(b.amount, "Étoiles", 1, 20);
        if (!Number.isInteger(amount)) throw new StudyError("Nombre d'étoiles invalide.");
        recorded = await recordActivity(`points:${str(b.requestId, "Requête", 100, true)}`, "points", {}, amount, str(b.reason, "Activité", 500, true));
      } else throw new StudyError("Activité inconnue.");
      return Response.json({ recorded, ...(await getBadges()) });
    }
    throw new StudyError("Espace introuvable.", 404);
  } catch (e) { return errorResponse(e); }
}
