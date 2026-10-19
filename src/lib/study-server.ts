import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { focusSessions, literaryBooks, pages, progress, studyEvents, unlockedBadges } from "@/db/schema";
import { LIBRARY_STARTERS } from "./study-catalog";
import type { BadgeInfo, BadgeState } from "./study-types";

export class StudyError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function errorResponse(error: unknown) {
  if (error instanceof StudyError) return Response.json({ error: error.message }, { status: error.status });
  console.error("Study API failed:", error instanceof Error ? error.message : "unknown");
  return Response.json({ error: "Impossible d'enregistrer pour le moment. Réessaie." }, { status: 500 });
}
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get("content-length") || 0) > 9_000_000) throw new StudyError("Enregistrement trop volumineux.", 413);
  const raw = await req.text();
  if (raw.length > 9_000_000) throw new StudyError("Enregistrement trop volumineux.", 413);
  let body;
  try { body = JSON.parse(raw); } catch { throw new StudyError("Requête JSON invalide."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new StudyError("Requête invalide.");
  return body;
}
export function str(value: unknown, name: string, max = 10000, required = false): string {
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new StudyError(`${name} : texte ${required ? "requis, " : ""}${max} caractères maximum.`);
  return value;
}
export function num(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new StudyError(`${name} doit être compris entre ${min} et ${max}.`);
  return value;
}
export function audioData(value: unknown) {
  const data = str(value, "Audio", 8_200_000);
  if (data && !/^data:audio\/(?:wav|x-wav|webm|ogg|mp4|mpeg)(?:;codecs=[\w.-]+)?;base64,[A-Za-z0-9+/=]+$/.test(data)) throw new StudyError("Format audio non pris en charge.");
  return data;
}
export function dateKey(value: unknown) {
  const date = str(value, "Date", 10, true);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new StudyError("Date invalide.");
  return date;
}
export function positiveId(value: string) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new StudyError("Identifiant invalide.");
  return id;
}
export async function seedLiterature() {
  await db.transaction(async (tx) => {
    const [marker] = await tx.insert(studyEvents).values({ key: "literature-starters-v1", kind: "seed" }).onConflictDoNothing().returning();
    if (marker) await tx.insert(literaryBooks).values(LIBRARY_STARTERS).onConflictDoNothing();
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function awardStars(tx: Tx, amount: number, reason: string, extraPomodoros = 0) {
  await tx.insert(progress).values({ key: "main", points: 0, pomodoros: 0, data: { history: [] } }).onConflictDoNothing();
  const [row] = await tx.select().from(progress).where(eq(progress.key, "main")).for("update");
  const old = (row.data || {}) as Record<string, unknown>;
  const history = Array.isArray(old.history) ? old.history.filter((s): s is string => typeof s === "string") : [];
  await tx.update(progress).set({ points: (row.points || 0) + amount, pomodoros: (row.pomodoros || 0) + extraPomodoros, data: { ...old, history: [...history, reason].slice(-40) } }).where(eq(progress.id, row.id));
}
export async function recordActivity(key: string, kind: string, data: Record<string, unknown>, stars = 0, reason = "") {
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(studyEvents).values({ key, kind, data }).onConflictDoNothing().returning();
    if (row && stars) await awardStars(tx, stars, reason);
    return Boolean(row);
  });
}
export async function completeSummary(pageId: number) {
  const [page] = await db.select().from(pages).where(eq(pages.id, pageId));
  if (!page) throw new StudyError("Page introuvable.", 404);
  if ((page.content || "").trim().length < 40) throw new StudyError("Écris un résumé d'au moins 40 caractères, puis enregistre-le.");
  return recordActivity(`summary:${pageId}`, "summary", { pageId, title: page.title }, 10, `Résumé terminé : ${page.title}`);
}
export async function getBadges(): Promise<BadgeState> {
  // A deadline may expire while another page is open. Settle it once under the
  // same lock as the timer before computing achievements.
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(793101)`);
    const expired = await tx.select().from(focusSessions).where(and(eq(focusSessions.status, "running"), sql`${focusSessions.endsAt} <= ${new Date()}`)).for("update");
    for (const session of expired) {
      await tx.update(focusSessions).set({ status: "completed", remainingSeconds: 0, completedAt: new Date(), endsAt: null }).where(eq(focusSessions.id, session.id));
      const [event] = await tx.insert(studyEvents).values({ key: `focus:${session.id}`, kind: "focus", data: { minutes: session.minutes } }).onConflictDoNothing().returning();
      if (event) await awardStars(tx, 15, `Séance de concentration de ${session.minutes} min terminée`, 1);
    }
  });
  const [events, sessions, unlocked] = await Promise.all([
    db.select({ kind: studyEvents.kind }).from(studyEvents).where(inArray(studyEvents.kind, ["summary", "question"])),
    db.select().from(focusSessions).where(inArray(focusSessions.status, ["completed", "abandoned"])).orderBy(asc(focusSessions.id)),
    db.select().from(unlockedBadges),
  ]);
  const summaryCount = events.filter((e) => e.kind === "summary").length;
  const questions = events.filter((e) => e.kind === "question").length;
  let focusStreak = 0, focusBest = 0;
  for (const session of sessions) {
    if (session.status === "abandoned") focusStreak = 0;
    else if (session.minutes >= 25) { focusStreak++; focusBest = Math.max(focusBest, focusStreak); }
  }
  const specs = [
    { key: "plume", title: "Plume d'or", description: "Terminer 5 résumés différents avec le bouton « Résumé terminé » du cahier.", goal: 5, current: summaryCount, icon: "Feather", color: "#fff3c4" },
    { key: "temps", title: "Maître du Temps", description: "Achever 10 séances de 25 min ou plus sans en abandonner une. Les pauses ne coupent pas la série.", goal: 10, current: focusBest, icon: "Timer", color: "#e3dcff" },
    { key: "curieuse", title: "Toujours Curieuse", description: "Poser plus de 20 questions au professeur. Les vérifications automatiques ne sont pas comptées.", goal: 21, current: questions, icon: "MessageCircleQuestion", color: "#ffd6e8" },
  ];
  const dates = new Map(unlocked.map((b) => [b.key, b.unlockedAt.toISOString()]));
  for (const spec of specs) {
    if (spec.current >= spec.goal && !dates.has(spec.key)) {
      const [badge] = await db.insert(unlockedBadges).values({ key: spec.key }).onConflictDoNothing().returning();
      if (badge) dates.set(spec.key, badge.unlockedAt.toISOString());
    }
  }
  const badges: BadgeInfo[] = specs.map((s) => ({ ...s, unlockedAt: dates.get(s.key) || null }));
  return { badges, summaryCount, questions, focusStreak, focusBest };
}
