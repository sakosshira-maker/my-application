import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { focusSessions, studyEvents } from "@/db/schema";
import { awardStars, errorResponse, num, readBody, StudyError } from "@/lib/study-server";
export const dynamic = "force-dynamic";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function current(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(793101)`);
  let [session] = await tx.select().from(focusSessions).orderBy(desc(focusSessions.id)).limit(1).for("update");
  if (session?.status === "running" && session.endsAt && session.endsAt.getTime() <= Date.now()) {
    [session] = await tx.update(focusSessions).set({ status: "completed", remainingSeconds: 0, completedAt: new Date(), endsAt: null }).where(eq(focusSessions.id, session.id)).returning();
    const [event] = await tx.insert(studyEvents).values({ key: `focus:${session.id}`, kind: "focus", data: { minutes: session.minutes } }).onConflictDoNothing().returning();
    if (event) await awardStars(tx, 15, `Séance de concentration de ${session.minutes} min terminée`, 1);
  }
  return session || null;
}
export async function GET() {
  try {
    const session = await db.transaction(current);
    return Response.json({ session, serverNow: Date.now() });
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request) {
  try {
    const b = await readBody(req);
    const session = await db.transaction(async (tx) => {
      const existing = await current(tx);
      if (b.action === "start") {
        if (existing && ["running", "paused"].includes(existing.status)) return existing;
        const minutes = num(b.minutes, "Minutes", 5, 50);
        if (![5, 10, 15, 20, 25, 30, 45, 50].includes(minutes)) throw new StudyError("Durée de concentration invalide.");
        const [row] = await tx.insert(focusSessions).values({ minutes, remainingSeconds: minutes * 60, endsAt: new Date(Date.now() + minutes * 60_000) }).returning();
        return row;
      }
      if (!existing || b.id !== existing.id) throw new StudyError("Cette séance n'est plus active. Actualise le minuteur.", 409);
      if (["completed", "abandoned"].includes(existing.status)) return existing;
      if (b.action === "complete") throw new StudyError("La séance n'est pas encore terminée.", 409);
      if (b.action === "pause") {
        if (existing.status === "paused") return existing;
        const remainingSeconds = Math.max(1, Math.ceil(((existing.endsAt?.getTime() || Date.now()) - Date.now()) / 1000));
        const [row] = await tx.update(focusSessions).set({ status: "paused", remainingSeconds, endsAt: null }).where(eq(focusSessions.id, existing.id)).returning();
        return row;
      }
      if (b.action === "resume") {
        if (existing.status === "running") return existing;
        const [row] = await tx.update(focusSessions).set({ status: "running", endsAt: new Date(Date.now() + existing.remainingSeconds * 1000) }).where(eq(focusSessions.id, existing.id)).returning();
        return row;
      }
      if (b.action === "abandon") {
        const [row] = await tx.update(focusSessions).set({ status: "abandoned", endsAt: null }).where(eq(focusSessions.id, existing.id)).returning();
        return row;
      }
      throw new StudyError("Action inconnue.");
    });
    return Response.json({ session, serverNow: Date.now() });
  } catch (e) { return errorResponse(e); }
}
