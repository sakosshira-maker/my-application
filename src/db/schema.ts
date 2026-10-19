import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, doublePrecision,
} from "drizzle-orm/pg-core";

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  short: text("short").default(""),
  color: text("color").default("#ffd6e8"),
  icon: text("icon").default("BookOpen"),
  teacher: text("teacher").default(""),
  coefficient: integer("coefficient").default(1),
  credits: integer("credits").default(3),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timetableSlots = pgTable("timetable_slots", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  day: integer("day").notNull().default(0), // 0=Samedi ... 5=Jeudi
  startTime: text("start_time").default("08:00"),
  endTime: text("end_time").default("09:30"),
  room: text("room").default(""),
  kind: text("kind").default("Cours"), // Cours | TD | TP
  createdAt: timestamp("created_at").defaultNow(),
});

export const notebooks = pgTable("notebooks", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coverColor: text("cover_color").default("#ffd6e8"),
  coverIcon: text("cover_icon").default("NotebookPen"),
  kind: text("kind").default("Cours"), // Cours | Résumés | Exercices | Glossaire
  createdAt: timestamp("created_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  notebookId: integer("notebook_id").references(() => notebooks.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").default("Page sans titre"),
  content: text("content").default(""),
  paper: text("paper").default("seyes"), // seyes | lignes | points | carreaux | blanc
  font: text("font").default("Caveat"),
  ink: text("ink").default("#3b4a6b"),
  fontSize: integer("font_size").default(21),
  stickers: jsonb("stickers").default([]),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stickyNotes = pgTable("sticky_notes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  color: text("color").default("#fff3a6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  definition: text("definition").default(""),
  example: text("example").default(""),
  known: boolean("known").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: jsonb("options").default([]),
  correctIndex: integer("correct_index").default(0),
  explanation: text("explanation").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  label: text("label").default("Évaluation"),
  score: doublePrecision("score").default(0),
  outOf: doublePrecision("out_of").default(20),
  kind: text("kind").default("CC"), // CC | Examen | TP | Exposé
  date: text("date").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").default("Présentation"),
  mime: text("mime").default(""),
  size: integer("size").default(0),
  dataUrl: text("data_url").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceNotes = pgTable("voice_notes", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  pageId: integer("page_id"),
  title: text("title").default("Note vocale"),
  dataUrl: text("data_url").default(""),
  duration: integer("duration").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stageEntries = pgTable("stage_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").default("Observation"),
  school: text("school").default(""),
  date: text("date").default(""),
  content: text("content").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doubts = pgTable("doubts", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id"),
  question: text("question").notNull(),
  answer: text("answer").default(""),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  points: integer("points").default(0),
  pomodoros: integer("pomodoros").default(0),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const literaryBooks = pgTable("literary_books", {
  id: serial("id").primaryKey(), slug: text("slug").unique(),
  title: text("title").notNull(), author: text("author").notNull().default(""),
  year: text("year").notNull().default(""), genre: text("genre").notNull().default("Roman"),
  color: text("color").notNull().default("#e3dcff"), status: text("status").notNull().default("À lire"),
  characters: text("characters").notNull().default(""), narrative: text("narrative").notNull().default(""),
  timeline: text("timeline").notNull().default(""), quotes: jsonb("quotes").notNull().default([]),
  notes: text("notes").notNull().default(""), sourceUrl: text("source_url").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(), date: text("date").notNull().unique(), mood: text("mood").notNull(),
  note: text("note").notNull().default(""), audioData: text("audio_data").notNull().default(""),
  duration: doublePrecision("duration").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const savedWords = pgTable("saved_words", {
  id: serial("id").primaryKey(), slug: text("slug").notNull().unique(),
  term: text("term").notNull(), category: text("category").notNull(),
  definition: text("definition").notNull(), example: text("example").notNull(),
  mastered: boolean("mastered").notNull().default(false), createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const oralSessions = pgTable("oral_sessions", {
  id: serial("id").primaryKey(), title: text("title").notNull(), kind: text("kind").notNull().default("Explication"),
  reference: text("reference").notNull().default(""), transcript: text("transcript").notNull().default(""),
  audioData: text("audio_data").notNull(), duration: doublePrecision("duration").notNull(),
  metrics: jsonb("metrics").notNull().default({}), review: jsonb("review"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const lessonPlans = pgTable("lesson_plans", {
  id: serial("id").primaryKey(), title: text("title").notNull(), level: text("level").notNull(),
  kind: text("kind").notNull(), duration: integer("duration").notNull(),
  support: text("support").notNull().default(""), objectives: text("objectives").notNull().default(""),
  prerequisites: text("prerequisites").notNull().default(""), materials: text("materials").notNull().default(""),
  assessment: text("assessment").notNull().default(""), differentiation: text("differentiation").notNull().default(""),
  phases: jsonb("phases").notNull().default([]), createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const studyEvents = pgTable("study_events", {
  id: serial("id").primaryKey(), key: text("key").notNull().unique(), kind: text("kind").notNull(),
  data: jsonb("data").notNull().default({}), createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const unlockedBadges = pgTable("unlocked_badges", {
  id: serial("id").primaryKey(), key: text("key").notNull().unique(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});
export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(), minutes: integer("minutes").notNull(),
  status: text("status").notNull().default("running"), remainingSeconds: integer("remaining_seconds").notNull(),
  endsAt: timestamp("ends_at"), createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
