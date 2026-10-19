export type Sticker = { icon: string; x: number; y: number; color: string; size: number; rot: number };

export interface ModuleT { id: number; name: string; short: string; color: string; icon: string; teacher: string; coefficient: number; credits: number; description: string }
export interface SlotT { id: number; moduleId: number; day: number; startTime: string; endTime: string; room: string; kind: string }
export interface NotebookT { id: number; moduleId: number; title: string; coverColor: string; coverIcon: string; kind: string }
export interface PageT { id: number; notebookId: number; moduleId: number; title: string; content: string; paper: string; font: string; ink: string; fontSize: number; stickers: Sticker[]; sortOrder: number }
export interface StickyT { id: number; moduleId: number; text: string; color: string }
export interface FlashT { id: number; moduleId: number; term: string; definition: string; example: string; known: boolean }
export interface QuizT { id: number; moduleId: number; question: string; options: string[]; correctIndex: number; explanation: string }
export interface GradeT { id: number; moduleId: number; label: string; score: number; outOf: number; kind: string; date: string }
export interface AttachT { id: number; moduleId: number; name: string; kind: string; mime: string; size: number; dataUrl: string }
export interface VoiceT { id: number; moduleId: number; pageId: number | null; title: string; dataUrl: string; duration: number }
export interface StageT { id: number; title: string; category: string; school: string; date: string; content: string }
export interface DoubtT { id: number; moduleId: number | null; question: string; answer: string; resolved: boolean }
export interface ProgressT { id?: number; points: number; pomodoros: number; data: { history?: string[] } }

export interface AppData {
  modules: ModuleT[]; timetable: SlotT[]; notebooks: NotebookT[]; pages: PageT[];
  stickies: StickyT[]; flashcards: FlashT[]; quiz: QuizT[]; grades: GradeT[];
  attachments: AttachT[]; voice: VoiceT[]; stage: StageT[]; doubts: DoubtT[]; progress: ProgressT;
}

export async function apiCreate(resource: string, body: Record<string, unknown>) {
  const r = await fetch(`/api/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("create failed");
  return r.json();
}
export async function apiUpdate(resource: string, id: number, body: Record<string, unknown>) {
  const r = await fetch(`/api/${resource}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("update failed");
  return r.json();
}
export async function apiDelete(resource: string, id: number) {
  await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
}

export const DAYS = ["السبت · Samedi", "الأحد · Dimanche", "الاثنين · Lundi", "الثلاثاء · Mardi", "الأربعاء · Mercredi", "الخميس · Jeudi"];
export const DAYS_FR = ["Samedi", "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi"];

export const PASTELS = ["#ffd6e8", "#e3dcff", "#cdeffd", "#d8f5d0", "#ffe3c2", "#ffd9d9", "#fff3a6", "#d9f2ea", "#f9d5ec", "#dce9ff"];

export const INKS = [
  { name: "Bleu nuit", value: "#3b4a6b" },
  { name: "Rose bonbon", value: "#d14d7e" },
  { name: "Lavande", value: "#6d4c9f" },
  { name: "Menthe", value: "#2f7d63" },
  { name: "Café doux", value: "#8a5a3b" },
  { name: "Prune", value: "#7a3b69" },
  { name: "Noir velours", value: "#33303e" },
  { name: "Corail", value: "#d95f43" },
];

export const FONTS = [
  { name: "Caveat — خط يد فرنسي", value: "Caveat" },
  { name: "Dancing Script — راقٍ", value: "Dancing Script" },
  { name: "Patrick Hand — دفتر", value: "Patrick Hand" },
  { name: "Kalam — عفوي", value: "Kalam" },
  { name: "Marhey — مرح عربي", value: "Marhey" },
  { name: "Tajawal — واضح عربي", value: "Tajawal" },
  { name: "Quicksand — رسمي ناعم", value: "Quicksand" },
];

export const PAPERS = [
  { name: "Séyès — كراس فرنسي كلاسيكي", value: "seyes" },
  { name: "مسطّر — Ligné", value: "lignes" },
  { name: "منقّط — Bullet Journal", value: "points" },
  { name: "مربّعات وردية — Quadrillé", value: "carreaux" },
  { name: "أبيض رسمي — Blanc", value: "blanc" },
];

export const STICKERS = [
  "Heart", "Star", "Flower2", "Sparkles", "Cat", "Rabbit", "Coffee", "Rainbow",
  "Sun", "MoonStar", "Feather", "Gift", "Crown", "Music", "BookHeart", "Cherry",
  "CloudSun", "Palette", "Ribbon", "Gem",
];

export const QUOTES = [
  "Petit à petit, l'oiseau fait son nid. — خطوة صغيرة كل يوم تصنع نجاحاً كبيراً.",
  "La réussite appartient à ceux qui se lèvent tôt… et qui révisent avec le sourire !",
  "Enseigner, c'est apprendre deux fois. — Joseph Joubert",
  "Il n'y a qu'une façon d'échouer, c'est d'abandonner avant d'avoir réussi.",
  "Chaque page relue est une fleur de plus dans ton jardin de réussite.",
  "Le français est une chanson : plus tu l'écoutes, plus tu la chantes juste.",
  "Sois patiente avec toi-même : même les plus belles fleurs prennent le temps d'éclore.",
  "Un jour, tes élèves diront : « C'est grâce à elle que j'aime le français. »",
  "La persévérance est la clé qui ouvre toutes les portes, même celles de la grammaire !",
  "Crois en toi : tu es plus proche de ton objectif qu'hier.",
  "Apprendre une langue, c'est avoir une âme de plus. — Proverbe tchèque",
  "Fais de chaque erreur une leçon, et de chaque leçon un pas vers l'excellence.",
];

export const PET_PHRASES = [
  "Bravo ! Tu as super bien travaillé aujourd'hui !",
  "Je suis fier de toi, ma future professeure !",
  "Encore un petit effort, tu es formidable !",
  "Tes élèves auront tellement de chance de t'avoir !",
  "Chaque fiche terminée me fait grandir de joie !",
  "Allons-y, révisons ensemble, pas à pas !",
  "Tu es la meilleure élève-professeure que je connaisse !",
  "Magnifique ! Ton cahier devient un vrai trésor !",
];

export function quoteOfDay() {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function petLevel(points: number) {
  if (points >= 600) return 5;
  if (points >= 350) return 4;
  if (points >= 180) return 3;
  if (points >= 80) return 2;
  return 1;
}

export function printPages(title: string, pages: PageT[], moduleName: string) {
  const paperBg: Record<string, string> = {
    seyes: "background-image: linear-gradient(to right, transparent 0 44px, rgba(255,107,138,.45) 44px 46px, transparent 46px), repeating-linear-gradient(to bottom, transparent 0 31px, rgba(109,157,246,.5) 31px 32px), repeating-linear-gradient(to right, transparent 0 31px, rgba(109,157,246,.22) 31px 32px);",
    lignes: "background-image: linear-gradient(to right, transparent 0 44px, rgba(255,107,138,.45) 44px 46px, transparent 46px), repeating-linear-gradient(to bottom, transparent 0 31px, rgba(109,157,246,.55) 31px 32px);",
    points: "background-image: radial-gradient(rgba(155,126,222,.35) 1.6px, transparent 1.6px); background-size: 24px 24px;",
    carreaux: "background-image: repeating-linear-gradient(to bottom, transparent 0 23px, rgba(255,158,199,.4) 23px 24px), repeating-linear-gradient(to right, transparent 0 23px, rgba(255,158,199,.4) 23px 24px);",
    blanc: "",
  };
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Dancing+Script:wght@600;700&family=Patrick+Hand&family=Kalam&family=Marhey&family=Tajawal:wght@500;700&family=Quicksand:wght@600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Quicksand, sans-serif; color:#3b4a6b; }
    .cover { text-align:center; padding: 60px 20px; border: 3px dashed #ff9ec7; border-radius: 24px; page-break-after: always; background:#fff7fb; }
    .cover h1 { font-family:'Dancing Script',cursive; font-size:44px; color:#d14d7e; margin:8px 0; }
    .cover p { color:#8a6d9e; }
    .page { page-break-after: always; min-height: 250mm; padding: 18px 18px 18px 58px; border:1.5px solid #f3d7e6; border-radius:14px; position:relative; background-color:#fffef9; }
    .page h2 { font-family:'Caveat',cursive; font-size:30px; color:#d14d7e; margin:0 0 10px; }
    .content { white-space: pre-wrap; line-height: 32px; }
    .num { position:absolute; bottom:10px; right:16px; font-size:12px; color:#c39ac0; }
  </style></head><body>
  <div class="cover"><p>${moduleName}</p><h1>${title}</h1><p>Mon Carnet d'Études — École Normale Supérieure · Français (Secondaire)</p></div>
  ${pages.map((p, i) => `<div class="page" style="${paperBg[p.paper] || ""}"><h2>${p.title}</h2><div class="content" style="font-family:'${p.font}',cursive; font-size:${p.fontSize}px; color:${p.ink};">${(p.content || "").replace(/</g, "&lt;")}</div><div class="num">— ${i + 1} —</div></div>`).join("")}
  <script>window.onload = () => { setTimeout(() => window.print(), 450); }</script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
