import { eq } from "drizzle-orm";
import { db } from "@/db";
import { moodEntries, oralSessions } from "@/db/schema";
import { errorResponse, positiveId, StudyError } from "@/lib/study-server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const url = new URL(req.url); const resource = url.searchParams.get("resource");
    if (resource !== "oral" && resource !== "moods") throw new StudyError("Audio introuvable.", 404);
    const id = positiveId(url.searchParams.get("id") || "");
    const table = resource === "oral" ? oralSessions : moodEntries;
    const [row] = await db.select({ audio: table.audioData }).from(table).where(eq(table.id, id));
    if (!row?.audio) throw new StudyError("Audio introuvable.", 404);
    const match = /^data:(audio\/[\w.-]+)(?:;codecs=[\w.-]+)?;base64,(.+)$/.exec(row.audio);
    if (!match) throw new StudyError("Audio illisible.", 422);
    const bytes = Buffer.from(match[2], "base64");
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": match[1], "Content-Length": String(bytes.length), "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename="${resource}-${id}.wav"` } });
  } catch (e) { return errorResponse(e); }
}
