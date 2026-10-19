export type MoodKey = "joyful" | "motivated" | "tired" | "stressed";
export interface OralMetrics {
  duration: number;
  silencePercent: number;
  longPauses: number;
  rmsDb: number;
  clippedPercent: number;
}
export interface OralReview {
  source: "local" | "audio-ai";
  transcript: string;
  words: number | null;
  wordsPerMinute: number | null;
  strengths: string[];
  advice: string[];
  articulation: string;
  intonation: string;
  exercise: string;
  limitation: string;
}
export interface OralSession {
  id: number; title: string; kind: string; reference: string; transcript: string;
  audioData: string; duration: number; metrics: OralMetrics; review: OralReview | null; createdAt: string;
}
export interface BookQuote { text: string; reference: string }
export interface LiteraryBook {
  id: number; slug: string | null; title: string; author: string; year: string; genre: string;
  color: string; characters: string; narrative: string; timeline: string; quotes: BookQuote[];
  notes: string; status: "À lire" | "En cours" | "Lu"; sourceUrl: string; createdAt: string;
}
export interface MoodEntry {
  id: number; date: string; mood: MoodKey; note: string; audioData: string; duration: number; updatedAt: string;
}
export interface DailyWord { slug: string; term: string; category: string; definition: string; example: string }
export interface SavedWord extends DailyWord { id: number; mastered: boolean; createdAt: string }
export interface LessonPhase { name: string; minutes: number; teacher: string; learners: string; evidence: string }
export interface LessonDraft {
  title: string; level: string; kind: string; duration: number; support: string;
  objectives: string; prerequisites: string; materials: string; assessment: string; differentiation: string;
  phases: LessonPhase[];
}
export interface LessonPlan extends LessonDraft { id: number; createdAt: string; updatedAt: string }
export interface BadgeInfo {
  key: string; title: string; description: string; icon: string; color: string;
  current: number; goal: number; unlockedAt: string | null;
}
export interface BadgeState { badges: BadgeInfo[]; summaryCount: number; questions: number; focusStreak: number; focusBest: number }
export interface FocusSession {
  id: number; minutes: number; status: "running" | "paused" | "completed" | "abandoned";
  remainingSeconds: number; endsAt: string | null; createdAt: string; completedAt: string | null;
}
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function countFrenchWords(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || []).length;
}
