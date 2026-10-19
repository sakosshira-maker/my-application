import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";

export const dynamic = "force-dynamic";

const SEED_MODULES = [
  { name: "Grammaire française", short: "GRAM", color: "#ffd6e8", icon: "SpellCheck", teacher: "Mme Benali", coefficient: 2, credits: 4, description: "Morphosyntaxe, conjugaison et analyse de la phrase." },
  { name: "Littérature française", short: "LITT", color: "#e3dcff", icon: "BookOpen", teacher: "M. Cherif", coefficient: 2, credits: 4, description: "Du Moyen Âge au XXIe siècle : mouvements, auteurs et analyses de textes." },
  { name: "Linguistique générale", short: "LING", color: "#cdeffd", icon: "Languages", teacher: "Mme Haddad", coefficient: 1, credits: 3, description: "Saussure, signe linguistique, phonologie et sémantique." },
  { name: "Didactique du FLE", short: "DIDA", color: "#d8f5d0", icon: "GraduationCap", teacher: "M. Mansouri", coefficient: 2, credits: 4, description: "Approches et méthodes d'enseignement du français langue étrangère." },
  { name: "Psychopédagogie", short: "PSY", color: "#ffe3c2", icon: "HeartHandshake", teacher: "Mme Ziani", coefficient: 1, credits: 2, description: "Psychologie de l'adolescent et gestion de classe au secondaire." },
  { name: "Civilisation française", short: "CIV", color: "#ffd9d9", icon: "Landmark", teacher: "M. Boudiaf", coefficient: 1, credits: 2, description: "Histoire, société et culture francophones." },
  { name: "Techniques d'expression", short: "TEO", color: "#fff3a6", icon: "PenLine", teacher: "Mme Kaci", coefficient: 1, credits: 3, description: "Expression écrite et orale : résumé, dissertation, exposé." },
  { name: "Phonétique", short: "PHON", color: "#d9f2ea", icon: "AudioLines", teacher: "M. Saidi", coefficient: 1, credits: 2, description: "API, transcription et correction phonétique." },
];

async function seed() {
  const mods = await db.insert(s.modules).values(SEED_MODULES).returning();
  const byShort: Record<string, number> = {};
  mods.forEach((m) => (byShort[m.short || ""] = m.id));

  await db.insert(s.timetableSlots).values([
    { moduleId: byShort.GRAM, day: 1, startTime: "08:00", endTime: "09:30", room: "Amphi B", kind: "Cours" },
    { moduleId: byShort.LITT, day: 1, startTime: "09:40", endTime: "11:10", room: "Salle 12", kind: "Cours" },
    { moduleId: byShort.DIDA, day: 1, startTime: "11:20", endTime: "12:50", room: "Salle 7", kind: "TD" },
    { moduleId: byShort.LING, day: 2, startTime: "08:00", endTime: "09:30", room: "Amphi A", kind: "Cours" },
    { moduleId: byShort.PHON, day: 2, startTime: "09:40", endTime: "11:10", room: "Labo langues", kind: "TP" },
    { moduleId: byShort.PSY, day: 3, startTime: "10:00", endTime: "11:30", room: "Salle 4", kind: "Cours" },
    { moduleId: byShort.CIV, day: 4, startTime: "08:00", endTime: "09:30", room: "Salle 9", kind: "Cours" },
    { moduleId: byShort.TEO, day: 4, startTime: "09:40", endTime: "11:10", room: "Salle 3", kind: "TD" },
    { moduleId: byShort.GRAM, day: 4, startTime: "11:20", endTime: "12:50", room: "Salle 12", kind: "TD" },
    { moduleId: byShort.LITT, day: 5, startTime: "13:00", endTime: "15:00", room: "Salle 12", kind: "Cours" },
    { moduleId: byShort.DIDA, day: 6, startTime: "08:00", endTime: "12:00", room: "Salle 7", kind: "TD" },
  ]);

  const [nb1] = await db.insert(s.notebooks).values([
    { moduleId: byShort.GRAM, title: "Cahier de grammaire", coverColor: "#ffd6e8", coverIcon: "NotebookPen", kind: "Cours" },
  ]).returning();
  const [nb2] = await db.insert(s.notebooks).values([
    { moduleId: byShort.GRAM, title: "Fiches de révision", coverColor: "#cdeffd", coverIcon: "Sparkles", kind: "Résumés" },
  ]).returning();
  const [nb3] = await db.insert(s.notebooks).values([
    { moduleId: byShort.LITT, title: "Analyses de textes", coverColor: "#d8f5d0", coverIcon: "BookOpen", kind: "Cours" },
  ]).returning();

  await db.insert(s.pages).values([
    {
      notebookId: nb1.id, moduleId: byShort.GRAM, title: "Le subjonctif présent", paper: "seyes", font: "Caveat", ink: "#3b4a6b", fontSize: 22, sortOrder: 0,
      content: "Le subjonctif présent\n\nFormation : radical de la 3e personne du pluriel du présent + terminaisons : -e, -es, -e, -ions, -iez, -ent.\n\nExemples :\n• parler → que je parle, que nous parlions\n• finir → que je finisse, que nous finissions\n\nEmplois principaux :\n• après les verbes de volonté : vouloir que, souhaiter que\n• après les expressions impersonnelles : il faut que, il est important que\n• après les verbes de sentiment : je suis contente que tu sois là\n\nAttention aux verbes irréguliers : être (sois), avoir (aie), faire (fasse), pouvoir (puisse), aller (aille).",
      stickers: [{ icon: "Star", x: 88, y: 6, color: "#f6b93b", size: 34, rot: 12 }, { icon: "Heart", x: 92, y: 80, color: "#ff7bac", size: 30, rot: -8 }],
    },
    {
      notebookId: nb1.id, moduleId: byShort.GRAM, title: "Les pronoms relatifs", paper: "lignes", font: "Caveat", ink: "#6d4c9f", fontSize: 22, sortOrder: 1,
      content: "Les pronoms relatifs simples\n\n• qui → sujet : L'élève qui lit est attentif.\n• que → COD : Le livre que je lis est passionnant.\n• dont → complément en « de » : Le sujet dont tu parles est difficile.\n• où → lieu / temps : La ville où je suis née.\n\nAstuce : remplace mentalement par l'antécédent pour vérifier la fonction !",
      stickers: [{ icon: "Flower2", x: 90, y: 10, color: "#ff9ec7", size: 34, rot: 0 }],
    },
    {
      notebookId: nb2.id, moduleId: byShort.GRAM, title: "Fiche express — Concordance des temps", paper: "points", font: "Patrick Hand", ink: "#2f5d50", fontSize: 20, sortOrder: 0,
      content: "Concordance des temps (indicatif)\n\nProposition principale au présent :\n• simultanéité → présent\n• antériorité → passé composé / imparfait\n• postériorité → futur simple\n\nProposition principale au passé :\n• simultanéité → imparfait\n• antériorité → plus-que-parfait\n• postériorité → conditionnel présent\n\nExemple : Il a dit qu'il viendrait. (postériorité dans le passé)",
      stickers: [],
    },
    {
      notebookId: nb3.id, moduleId: byShort.LITT, title: "Le romantisme (1820-1850)", paper: "seyes", font: "Dancing Script", ink: "#7a3b69", fontSize: 23, sortOrder: 0,
      content: "Le romantisme français\n\nContexte : réaction contre le classicisme, exaltation du « moi » et des sentiments.\n\nAuteurs majeurs :\n• Victor Hugo — Les Misérables, Notre-Dame de Paris, préface de Cromwell (1827)\n• Alphonse de Lamartine — Méditations poétiques (1820)\n• Alfred de Musset — Les Nuits\n• George Sand — Indiana\n\nThèmes : nature miroir de l'âme, mal du siècle, fuite du temps, amour et mort.\n\nLa bataille d'Hernani (1830) marque le triomphe du drame romantique.",
      stickers: [{ icon: "Feather", x: 89, y: 8, color: "#9b7ede", size: 32, rot: -10 }],
    },
  ]);

  await db.insert(s.stickyNotes).values([
    { moduleId: byShort.GRAM, text: "Mme Benali insiste toujours sur les verbes irréguliers du subjonctif !", color: "#fff3a6" },
    { moduleId: byShort.GRAM, text: "Devoir pour dimanche : exercices 4 et 5 page 87.", color: "#ffd6e8" },
    { moduleId: byShort.LITT, text: "Lire l'acte I d'Hernani avant le prochain TD.", color: "#d8f5d0" },
  ]);

  await db.insert(s.flashcards).values([
    { moduleId: byShort.GRAM, term: "Subjonctif après « bien que »", definition: "« Bien que » est toujours suivi du subjonctif.", example: "Bien qu'il soit fatigué, il continue." },
    { moduleId: byShort.GRAM, term: "Accord du participe passé avec « avoir »", definition: "Accord avec le COD si celui-ci est placé avant le verbe.", example: "Les fleurs que j'ai cueillies." },
    { moduleId: byShort.LING, term: "Signe linguistique (Saussure)", definition: "Union d'un signifiant (image acoustique) et d'un signifié (concept).", example: "Le mot « arbre » : /aʁbʁ/ + concept d'arbre." },
    { moduleId: byShort.LING, term: "Langue / Parole", definition: "La langue est le système social partagé ; la parole est son utilisation individuelle.", example: "" },
    { moduleId: byShort.DIDA, term: "Approche communicative", definition: "Méthode centrée sur la communication réelle et l'interaction en classe de FLE.", example: "Jeux de rôle, tâches authentiques." },
  ]);

  await db.insert(s.quizQuestions).values([
    { moduleId: byShort.GRAM, question: "Quelle est la forme correcte ? « Il faut que tu ___ (venir) demain. »", options: ["viens", "viennes", "viendras", "venais"], correctIndex: 1, explanation: "Après « il faut que », on emploie le subjonctif présent : que tu viennes." },
    { moduleId: byShort.GRAM, question: "Quel pronom relatif complète : « Le roman ___ je t'ai parlé est passionnant. » ?", options: ["que", "qui", "dont", "où"], correctIndex: 2, explanation: "« Parler de » → le complément est introduit par « de », donc on utilise « dont »." },
    { moduleId: byShort.GRAM, question: "« Les lettres que j'ai ___ » : quel accord ?", options: ["écrit", "écrite", "écrites", "écrits"], correctIndex: 2, explanation: "COD « les lettres » (féminin pluriel) placé avant « avoir » → accord : écrites." },
    { moduleId: byShort.LITT, question: "Qui a écrit la préface de Cromwell, manifeste du drame romantique ?", options: ["Lamartine", "Victor Hugo", "Musset", "Balzac"], correctIndex: 1, explanation: "Victor Hugo, en 1827, y rejette les règles classiques des trois unités." },
    { moduleId: byShort.LING, question: "Pour Saussure, le signe linguistique unit :", options: ["Un mot et un objet", "Un signifiant et un signifié", "Une lettre et un son", "Un sujet et un verbe"], correctIndex: 1, explanation: "Le signe = signifiant (image acoustique) + signifié (concept)." },
  ]);

  await db.insert(s.grades).values([
    { moduleId: byShort.GRAM, label: "Interrogation 1", score: 15.5, outOf: 20, kind: "CC", date: "2026-10-12" },
    { moduleId: byShort.GRAM, label: "Devoir surveillé", score: 13, outOf: 20, kind: "Examen", date: "2026-11-03" },
    { moduleId: byShort.LITT, label: "Exposé : Hugo", score: 17, outOf: 20, kind: "Exposé", date: "2026-10-20" },
  ]);

  await db.insert(s.stageEntries).values([
    { title: "Première séance d'observation — 2AS Lettres", category: "Observation", school: "Lycée El Amel", date: "2026-10-15", content: "L'enseignante commence par une situation-problème pour éveiller la curiosité. Les élèves participent davantage lorsqu'elle pose des questions ouvertes. Gestion du temps : 10 min de rappel, 30 min d'activité, 15 min de synthèse. À retenir : varier les supports (texte + image) maintient l'attention des adolescents." },
    { title: "Grille d'évaluation d'une production écrite", category: "Pédagogie", school: "", date: "2026-10-18", content: "Critères vus avec le tuteur : respect de la consigne, organisation des idées, correction de la langue, créativité. Toujours annoter de manière encourageante : souligner d'abord ce qui est réussi avant de corriger." },
  ]);

  await db.insert(s.doubts).values([
    { moduleId: byShort.GRAM, question: "Différence entre « quoique » et « quoi que » ?", answer: "« Quoique » (un mot) = bien que + subjonctif. « Quoi que » (deux mots) = quelle que soit la chose que.", resolved: true },
    { moduleId: byShort.LING, question: "Je n'ai pas bien compris la différence entre phonétique et phonologie.", answer: "", resolved: false },
    { moduleId: null, question: "Demander à M. Mansouri la différence entre approche par les compétences et pédagogie par objectifs.", answer: "", resolved: false },
  ]);

  await db.insert(s.progress).values([{ key: "main", points: 40, pomodoros: 2, data: { history: ["Premiers pas dans mon carnet"] } }]);
}

export async function GET() {
  const existing = await db.select().from(s.modules).limit(1);
  if (existing.length === 0) await seed();

  const [modules, timetable, notebooks, pages, stickies, flashcards, quiz, grades, attachments, voice, stage, doubts, progress] =
    await Promise.all([
      db.select().from(s.modules).orderBy(asc(s.modules.id)),
      db.select().from(s.timetableSlots).orderBy(asc(s.timetableSlots.id)),
      db.select().from(s.notebooks).orderBy(asc(s.notebooks.id)),
      db.select().from(s.pages).orderBy(asc(s.pages.id)),
      db.select().from(s.stickyNotes).orderBy(asc(s.stickyNotes.id)),
      db.select().from(s.flashcards).orderBy(asc(s.flashcards.id)),
      db.select().from(s.quizQuestions).orderBy(asc(s.quizQuestions.id)),
      db.select().from(s.grades).orderBy(asc(s.grades.id)),
      db.select().from(s.attachments).orderBy(asc(s.attachments.id)),
      db.select().from(s.voiceNotes).orderBy(asc(s.voiceNotes.id)),
      db.select().from(s.stageEntries).orderBy(asc(s.stageEntries.id)),
      db.select().from(s.doubts).orderBy(asc(s.doubts.id)),
      db.select().from(s.progress).orderBy(asc(s.progress.id)),
    ]);

  return NextResponse.json({
    modules, timetable, notebooks, pages, stickies, flashcards, quiz, grades,
    attachments, voice, stage, doubts, progress: progress[0] || { points: 0, pomodoros: 0, data: {} },
  });
}
