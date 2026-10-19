import "dotenv/config";
import assert from "node:assert/strict";
import { eq, inArray, like } from "drizzle-orm";
import { db, pool } from "../src/db/index";
import { pages, notebooks, studyEvents, focusSessions, progress, unlockedBadges, savedWords, moodEntries, literaryBooks, oralSessions, lessonPlans } from "../src/db/schema";
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const tag = `integration-${Date.now()}`;
async function api(path: string, method = "GET", body?: unknown, expected = 200): Promise<any> {
  const r = await fetch(`${base}/api/${path}`, { method, ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const raw = await r.text(); let data; try { data = JSON.parse(raw); } catch { data = raw; }
  assert.equal(r.status, expected, `${method} ${path}: ${raw.slice(0, 200)}`); return data;
}
function wav() {
  const rate = 16000, duration = 2, samples = rate * duration, b = Buffer.alloc(44 + samples * 2);
  b.write("RIFF", 0); b.writeUInt32LE(b.length - 8, 4); b.write("WAVE", 8); b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 220 * i / rate) * 3000), 44 + i * 2);
  return `data:audio/wav;base64,${b.toString("base64")}`;
}
(async () => {
  const previousProgress = await db.select().from(progress);
  const previousBadges = await db.select().from(unlockedBadges);
  const previousWords = await db.select().from(savedWords);
  const previousMoods = await db.select().from(moodEntries).where(eq(moodEntries.date, "2001-01-01"));
  const ids = { books: [] as number[], oral: [] as number[], plans: [] as number[], notebooks: [] as number[], pages: [] as number[], focus: [] as number[] };
  const cleanup = async () => {
    if (ids.books.length) await db.delete(literaryBooks).where(inArray(literaryBooks.id, ids.books));
    if (ids.oral.length) await db.delete(oralSessions).where(inArray(oralSessions.id, ids.oral));
    if (ids.plans.length) await db.delete(lessonPlans).where(inArray(lessonPlans.id, ids.plans));
    if (ids.notebooks.length) await db.delete(notebooks).where(inArray(notebooks.id, ids.notebooks));
    if (ids.focus.length) await db.delete(focusSessions).where(inArray(focusSessions.id, ids.focus));
    await db.delete(studyEvents).where(like(studyEvents.key, `%${tag}%`));
    for (const id of ids.pages) await db.delete(studyEvents).where(eq(studyEvents.key, `summary:${id}`));
    for (const id of ids.focus) await db.delete(studyEvents).where(eq(studyEvents.key, `focus:${id}`));
    for (const b of await db.select().from(unlockedBadges)) if (!previousBadges.some((p) => p.key === b.key)) await db.delete(unlockedBadges).where(eq(unlockedBadges.id, b.id));
    for (const p of previousProgress) await db.update(progress).set({ points: p.points, pomodoros: p.pomodoros, data: p.data }).where(eq(progress.id, p.id));
    if (!previousWords.some((w) => w.slug === "etayage")) await db.delete(savedWords).where(eq(savedWords.slug, "etayage"));
    if (!previousMoods.length) await db.delete(moodEntries).where(eq(moodEntries.date, "2001-01-01"));
    else { const m = previousMoods[0]; await db.update(moodEntries).set({ mood: m.mood, note: m.note, audioData: m.audioData, duration: m.duration, updatedAt: m.updatedAt }).where(eq(moodEntries.id, m.id)); }
  };
  try {
    assert((await api("study/books")).length >= 4);
    const book = await api("study/books", "POST", { title: tag, author: "Test", color: "#e3dcff", characters: "Alice", narrative: "Un récit.", timeline: "1. Début", quotes: [{ text: "Citation de test", reference: "Brouillon" }] }, 201); ids.books.push(book.id);
    const edited = await api(`study/books/${book.id}`, "PATCH", { notes: "Note conservée", status: "Lu" }); assert.equal(edited.notes, "Note conservée"); assert.equal(edited.title, tag);
    await api("study/books", "POST", { title: "", sourceUrl: "javascript:alert(1)" }, 400);
    await api("study/books", "POST", { title: tag, sourceUrl: "javascript:alert(1)" }, 400);
    console.log("PASS literary library CRUD and validation");

    const word = await api("study/words", "POST", { slug: "etayage" }, 201);
    const again = await api("study/words", "POST", { slug: "etayage" }, 201); assert.equal(word.id, again.id);
    const w = await api(`study/words/${word.id}`, "PATCH", { mastered: true }); assert.equal(w.mastered, true);
    console.log("PASS dictionary deduplication and memory flag");

    await api("study/moods", "POST", { date: "2001-01-01", mood: "tired", note: tag, audioData: wav(), duration: 2 });
    const mood = await api("study/moods", "POST", { date: "2001-01-01", mood: "motivated" }); assert.equal(mood.note, tag);
    const ventAudio = await fetch(base + mood.audioData); assert.equal(ventAudio.status, 200); assert.equal(ventAudio.headers.get("content-type"), "audio/wav");
    await api("study/moods", "POST", { date: "9999-99-99", mood: "tired" }, 400);
    await api("study/moods", "POST", { date: "2001-01-01", mood: "invalid" }, 400);
    console.log("PASS daily moods upsert preserving journal and invalid date handling");

    for (const kind of ["Langue & grammaire", "Lecture analytique", "Expression orale", "Production écrite"]) {
      const { draft } = await api("study/generate-plan", "POST", { title: "Le discours indirect", level: "1re année du baccalauréat", duration: 55, kind, support: "Un corpus personnel" });
      assert.equal(draft.phases.reduce((s: number, p: any) => s + p.minutes, 0), 55);
      const plan = await api("study/plans", "POST", draft, 201); ids.plans.push(plan.id);
      assert(plan.objectives.includes("discours indirect") || kind === "Lecture analytique");
      const changed = await api(`study/plans/${plan.id}`, "PATCH", { ...draft, objectives: "Objectifs ajustés après observation de la classe." }); assert(changed.objectives.startsWith("Objectifs ajustés"));
      await api("study/plans", "POST", { ...draft, duration: 90 }, 400);
    }
    console.log("PASS lesson generation, exact timings, saving and editing");

    const oral = await api("study/oral", "POST", { title: tag, audioData: wav(), transcript: "Bonjour la classe voici une définition claire", metrics: { duration: 2, silencePercent: 0, longPauses: 0, rmsDb: -24, clippedPercent: 0 } }, 201); ids.oral.push(oral.id);
    const stream = await fetch(base + oral.audioData); assert.equal(stream.status, 200); assert.equal(stream.headers.get("content-type"), "audio/wav");
    assert.equal(Buffer.from(await stream.arrayBuffer()).toString("ascii", 0, 4), "RIFF");
    const review = await api("study/oral-review", "POST", { id: oral.id, listen: false }); assert.equal(review.source, "local"); assert.equal(review.words, 7); assert.equal(review.wordsPerMinute, 210); assert.match(review.articulation, /Non évaluée/);
    const capability = await api("study/oral-review"); if (!capability.audioAI) await api("study/oral-review", "POST", { id: oral.id, listen: true }, 503);
    const changedOral = await api(`study/oral/${oral.id}`, "PATCH", { transcript: "Bonjour." }); assert.equal(changedOral.review, null);
    await api("study/oral", "POST", { title: tag, audioData: "data:audio/wav;base64,AAAA", metrics: { duration: 2, silencePercent: 0, longPauses: 0, rmsDb: -24, clippedPercent: 0 } }, 400);
    console.log("PASS saved audio playback and honest measurable oral feedback");

    const question = await api("study/tutor", "POST", { requestId: tag, question: "Pourquoi emploie-t-on le subjonctif après il faut que ?" }); assert.match(question.answer, /subjonctif/i);
    await api("study/tutor", "POST", { requestId: tag, question: "Pourquoi emploie-t-on le subjonctif après il faut que ?" });
    const counted = await db.select().from(studyEvents).where(eq(studyEvents.key, `question:${tag}`)); assert.equal(counted.length, 1);
    await db.insert(studyEvents).values(Array.from({ length: 20 }, (_, i) => ({ key: `${tag}-question-${i}`, kind: "question", data: { question: "Fixture de test" } })));
    const moduleList = await api("modules");
    const [nb] = await db.insert(notebooks).values({ moduleId: moduleList[0].id, title: tag, kind: "Résumés" }).returning(); ids.notebooks.push(nb.id);
    for (let i = 0; i < 5; i++) {
      const [page] = await db.insert(pages).values({ notebookId: nb.id, moduleId: moduleList[0].id, title: `${tag}-${i}`, content: "Un résumé réel doit contenir assez de texte pour que la notion expliquée soit compréhensible." }).returning(); ids.pages.push(page.id);
      const a = await api("study/activity", "POST", { kind: "summary", pageId: page.id }); assert.equal(a.recorded, true);
      const duplicate = await api("study/activity", "POST", { kind: "summary", pageId: page.id }); assert.equal(duplicate.recorded, false);
    }
    console.log("PASS distinct summaries and manual question counters, no duplicate credit");

    const existingFocus = (await api("study/focus")).session;
    if (!existingFocus || !["running", "paused"].includes(existingFocus.status)) {
      let s = (await api("study/focus", "POST", { action: "start", minutes: 25 })).session; ids.focus.push(s.id);
      const same = (await api("study/focus", "POST", { action: "start", minutes: 25 })).session; assert.equal(s.id, same.id);
      await api("study/focus", "POST", { action: "complete", id: s.id }, 409);
      s = (await api("study/focus", "POST", { action: "pause", id: s.id })).session; assert.equal(s.status, "paused");
      s = (await api("study/focus", "POST", { action: "resume", id: s.id })).session; assert.equal(s.status, "running");
      // Simulate elapsed wall-clock time in a tagged test session (no fake rewards left behind).
      await db.update(focusSessions).set({ endsAt: new Date(Date.now() - 2000) }).where(eq(focusSessions.id, s.id));
      const before = (await api("progress"))[0];
      const completed = (await api("study/focus")).session; assert.equal(completed.status, "completed");
      await api("study/focus"); const after = (await api("progress"))[0]; assert.equal(after.pomodoros, before.pomodoros + 1);
      const extra = await db.insert(focusSessions).values(Array.from({ length: 9 }, () => ({ minutes: 25, status: "completed", remainingSeconds: 0, completedAt: new Date() }))).returning(); ids.focus.push(...extra.map((s) => s.id));
      let badges = await api("study/badges"); assert(badges.badges.every((b: any) => b.unlockedAt));
      const reset = await db.insert(focusSessions).values({ minutes: 25, status: "abandoned", remainingSeconds: 900 }).returning(); ids.focus.push(reset[0].id);
      badges = await api("study/badges"); assert.equal(badges.focusStreak, 0); assert(badges.badges.find((b: any) => b.key === "temps").unlockedAt);
      console.log("PASS server-timed focus, single reward, all three badges, streak reset and permanent unlocks");
    }
    console.log("ALL STUDY API TESTS PASSED");
  } finally { await cleanup(); await pool.end(); console.log("Test records removed; original progress restored."); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
