import { audioData, num, str, StudyError } from "./study-server";
import type { LessonPhase, OralMetrics } from "./study-types";

export function bookValues(b: Record<string, unknown>, partial = false) {
  const result: Record<string, any> = {};
  for (const key of ["title", "author", "year", "genre", "characters", "narrative", "timeline", "notes", "sourceUrl", "color", "status"]) {
    if (partial && b[key] === undefined) continue;
    result[key] = str(b[key] ?? (key === "color" ? "#e3dcff" : key === "status" ? "À lire" : ""), key, ["title", "author", "genre"].includes(key) ? 250 : key === "year" ? 30 : 16000, key === "title");
  }
  if (result.color && !/^#[a-f\d]{6}$/i.test(result.color)) throw new StudyError("Choisis une couleur hexadécimale.");
  if (result.status && !["À lire", "En cours", "Lu"].includes(result.status)) throw new StudyError("Statut de lecture invalide.");
  if (result.sourceUrl) { try { const url = new URL(result.sourceUrl); if (!/^https?:$/.test(url.protocol)) throw new Error(); } catch { throw new StudyError("Le lien doit commencer par https:// ou http://."); } }
  if (!partial || b.quotes !== undefined) {
    const quotes = b.quotes ?? [];
    if (!Array.isArray(quotes) || quotes.length > 30) throw new StudyError("30 citations maximum par livre.");
    result.quotes = quotes.map((q) => {
      if (!q || typeof q !== "object") throw new StudyError("Citation invalide.");
      return { text: str(q.text, "Citation", 4000, true), reference: str(q.reference ?? "", "Référence", 500) };
    });
  }
  return result;
}
export function metricsValues(value: unknown): OralMetrics {
  if (!value || typeof value !== "object") throw new StudyError("Mesures audio manquantes.");
  const m = value as Record<string, unknown>;
  return { duration: num(m.duration, "Durée", 1, 182), silencePercent: num(m.silencePercent, "Silence", 0, 100), longPauses: num(m.longPauses, "Pauses", 0, 500), rmsDb: num(m.rmsDb, "Volume", -120, 0), clippedPercent: num(m.clippedPercent, "Saturation", 0, 100) };
}
export function oralValues(b: Record<string, unknown>) {
  const metrics = metricsValues(b.metrics);
  const audio = audioData(b.audioData);
  if (!audio.startsWith("data:audio/wav;base64,")) throw new StudyError("Enregistre un extrait WAV avec le microphone.");
  const bytes = Buffer.from(audio.split(",")[1], "base64");
  if (bytes.length < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE" || bytes.readUInt16LE(20) !== 1 || bytes.readUInt16LE(22) !== 1 || bytes.readUInt32LE(24) !== 16000 || bytes.readUInt16LE(34) !== 16 || bytes.toString("ascii", 36, 40) !== "data") throw new StudyError("L'audio doit être un enregistrement WAV mono 16 kHz du studio.");
  const duration = (bytes.length - 44) / 32000;
  if (duration < 1 || duration > 181 || Math.abs(duration - metrics.duration) > 0.6) throw new StudyError("La durée audio ne correspond pas aux mesures.");
  return { title: str(b.title, "Titre", 250, true), kind: str(b.kind ?? "Explication", "Activité", 50), reference: str(b.reference ?? "", "Texte de référence", 12000), transcript: str(b.transcript ?? "", "Transcription", 12000), audioData: audio, duration: metrics.duration, metrics };
}
export function planValues(b: Record<string, unknown>) {
  const title = str(b.title, "Titre", 250, true), level = str(b.level, "Niveau", 120, true);
  const duration = num(b.duration, "Durée", 15, 180);
  if (!Number.isInteger(duration)) throw new StudyError("Indique une durée entière en minutes.");
  if (!Array.isArray(b.phases) || b.phases.length < 3 || b.phases.length > 10) throw new StudyError("Prévois entre 3 et 10 phases.");
  const phases: LessonPhase[] = b.phases.map((p) => ({ name: str(p.name, "Phase", 200, true), minutes: num(p.minutes, "Minutes de phase", 1, 180), teacher: str(p.teacher, "Activité de l'enseignante", 6000), learners: str(p.learners, "Activité des élèves", 6000), evidence: str(p.evidence ?? "", "Trace", 4000) }));
  if (phases.reduce((sum, p) => sum + p.minutes, 0) !== duration) throw new StudyError("La somme des durées des phases doit correspondre à la durée de la séance.");
  return { title, level, duration, kind: str(b.kind, "Type", 80, true), support: str(b.support ?? "", "Support", 6000), objectives: str(b.objectives, "Objectifs", 8000, true), prerequisites: str(b.prerequisites ?? "", "Prérequis", 6000), materials: str(b.materials ?? "", "Matériel", 6000), assessment: str(b.assessment ?? "", "Évaluation", 6000), differentiation: str(b.differentiation ?? "", "Différenciation", 6000), phases };
}
