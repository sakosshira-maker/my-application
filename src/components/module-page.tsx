"use client";
import React, { useMemo, useRef, useState } from "react";
import {
  ArrowRight, Plus, Trash2, Upload, Download, Presentation, StickyNote, Dumbbell,
  Layers, CircleHelp, ChartColumn, NotebookPen, Check, Eye, RotateCcw, Trophy,
  GraduationCap, Pencil, FileText, Sparkles,
} from "lucide-react";
import type { AppData, ModuleT } from "@/lib/app";
import { PASTELS } from "@/lib/app";
import { sfx } from "@/lib/sound";
import { Icon, Modal, CuteButton, EmptyState } from "./ui";
import NotebookEditor from "./notebook-editor";
import { usePersistentState } from "@/lib/persistence";

type Create = (resource: string, body: Record<string, unknown>) => Promise<any>;
type Update = (resource: string, id: number, body: Record<string, unknown>) => Promise<any>;
type Remove = (resource: string, id: number) => Promise<void>;

const TABS = [
  { id: "cahiers", label: "الدفاتر والملخصات", fr: "Cahiers & Fiches", icon: NotebookPen },
  { id: "presentations", label: "العروض والمرفقات", fr: "Présentations", icon: Presentation },
  { id: "notes", label: "ملاحظات سريعة", fr: "Notes rapides", icon: StickyNote },
  { id: "exercices", label: "التمارين", fr: "Exercices & TP", icon: Dumbbell },
  { id: "glossaire", label: "بطاقات المصطلحات", fr: "Glossaire Flash", icon: Layers },
  { id: "quiz", label: "الكويز", fr: "Quiz", icon: CircleHelp },
  { id: "moyennes", label: "نقاطي ومعدلي", fr: "Mes notes", icon: ChartColumn },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ModulePage({ module, data, onBack, onCreate, onUpdate, onDelete, addPoints }: {
  module: ModuleT; data: AppData; onBack: () => void;
  onCreate: Create; onUpdate: Update; onDelete: Remove; addPoints: (n: number, r: string) => void;
}) {
  const [tab, setTab] = usePersistentState<TabId>(`tab:${module.id}`, "cahiers");
  const [editModule, setEditModule] = useState(false);
  const myGrades = data.grades.filter((g) => g.moduleId === module.id);
  const avg = moduleAverage(myGrades);
  const known = data.flashcards.filter((f) => f.moduleId === module.id && f.known).length;
  const flashTotal = data.flashcards.filter((f) => f.moduleId === module.id).length;
  const pageCount = data.pages.filter((p) => p.moduleId === module.id).length;

  return (
    <div className="anim-page">
      {/* Header */}
      <div className="cute-card overflow-hidden mb-4">
        <div className="p-5 relative" style={{ background: `linear-gradient(120deg, ${module.color}, #ffffff 120%)` }}>
          <div className="washi absolute top-2 left-8 w-24 h-5 bg-white/50 rotate-[-4deg] rounded-sm" />
          <button onClick={() => { sfx.flip(); onBack(); }} className="cute-btn bg-white/80 text-[#8a4b7c] px-3 py-1.5 text-sm font-bold inline-flex items-center gap-1.5 mb-3">
            <ArrowRight size={16} /> العودة إلى استعمال الزمن
          </button>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-3xl bg-white/80 border-2 border-white shadow flex items-center justify-center anim-wiggle">
              <Icon name={module.icon} size={34} color="#8a4b7c" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-display font-extrabold text-2xl text-[#5b3a5e]" dir="auto">{module.name}</h2>
              <p className="text-sm text-[#8a6d9e]" dir="auto">{module.description || "Mon espace de travail pour ce module."}</p>
              <div className="flex gap-2 flex-wrap mt-2 text-[11px] font-bold">
                <span className="bg-white/80 rounded-full px-2.5 py-1 text-[#8a4b7c] inline-flex items-center gap-1"><GraduationCap size={13} /> {module.teacher || "Enseignant(e) à définir"}</span>
                <span className="bg-white/80 rounded-full px-2.5 py-1 text-[#8a4b7c]">معامل {module.coefficient} · {module.credits} أرصدة</span>
                <span className="bg-white/80 rounded-full px-2.5 py-1 text-[#8a4b7c]">{pageCount} صفحة مكتوبة</span>
                <span className="bg-white/80 rounded-full px-2.5 py-1 text-[#8a4b7c]">بطاقات محفوظة {known}/{flashTotal}</span>
                {avg !== null && <span className="bg-[#8a4b7c] text-white rounded-full px-2.5 py-1 inline-flex items-center gap-1"><Trophy size={13} /> معدلي {avg.toFixed(2)}/20</span>}
              </div>
            </div>
            <button onClick={() => { sfx.pop(); setEditModule(true); }} className="cute-btn bg-white/80 text-[#8a4b7c] p-2" aria-label="Modifier le module"><Pencil size={17} /></button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 bg-white">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { sfx.flip(); setTab(t.id); }}
              className={`cute-btn shrink-0 px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 ${tab === t.id ? "bg-[#8a4b7c] text-white" : "bg-pink-50 text-[#8a6d9e]"}`}>
              <t.icon size={15} /> {t.label} <span className="opacity-60 font-normal hidden xl:inline">· {t.fr}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === "cahiers" && (
        <NotebookEditor module={module} notebooks={data.notebooks} pages={data.pages} voice={data.voice}
          onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} addPoints={addPoints} />
      )}
      {tab === "presentations" && <Presentations module={module} data={data} onCreate={onCreate} onDelete={onDelete} addPoints={addPoints} />}
      {tab === "notes" && <Stickies module={module} data={data} onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} />}
      {tab === "exercices" && <Exercices module={module} data={data} onCreate={onCreate} onDelete={onDelete} addPoints={addPoints} />}
      {tab === "glossaire" && <Glossaire module={module} data={data} onCreate={onCreate} onUpdate={onUpdate} onDelete={onDelete} addPoints={addPoints} />}
      {tab === "quiz" && <Quiz module={module} data={data} onCreate={onCreate} onDelete={onDelete} addPoints={addPoints} />}
      {tab === "moyennes" && <Moyennes module={module} data={data} onCreate={onCreate} onDelete={onDelete} addPoints={addPoints} />}

      {editModule && <EditModule module={module} onClose={() => setEditModule(false)} onUpdate={onUpdate} onDelete={onDelete} onBack={onBack} />}
    </div>
  );
}

export function moduleAverage(grades: { score: number; outOf: number; kind: string }[]): number | null {
  if (!grades.length) return null;
  const norm = (g: { score: number; outOf: number }) => (g.outOf ? (g.score / g.outOf) * 20 : 0);
  const cc = grades.filter((g) => g.kind === "CC" || g.kind === "TP" || g.kind === "Exposé");
  const ex = grades.filter((g) => g.kind === "Examen");
  const avgOf = (arr: typeof grades) => arr.reduce((a, g) => a + norm(g), 0) / arr.length;
  if (cc.length && ex.length) return avgOf(cc) * 0.4 + avgOf(ex) * 0.6;
  return avgOf(grades);
}

function EditModule({ module, onClose, onUpdate, onDelete, onBack }: { module: ModuleT; onClose: () => void; onUpdate: Update; onDelete: Remove; onBack: () => void }) {
  const [f, setF] = useState({ name: module.name, teacher: module.teacher, coefficient: module.coefficient, credits: module.credits, color: module.color, icon: module.icon, description: module.description });
  return (
    <Modal title="تعديل المادة · Modifier le module" onClose={onClose}>
      <div className="space-y-3">
        <input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nom du module" dir="auto" />
        <input className="field" value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })} placeholder="Enseignant(e) — الأستاذ(ة)" dir="auto" />
        <textarea className="field" rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Description courte…" dir="auto" />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold text-[#8a6d9e]">المعامل<input type="number" className="field mt-1" value={f.coefficient} onChange={(e) => setF({ ...f, coefficient: Number(e.target.value) })} /></label>
          <label className="text-xs font-bold text-[#8a6d9e]">الأرصدة<input type="number" className="field mt-1" value={f.credits} onChange={(e) => setF({ ...f, credits: Number(e.target.value) })} /></label>
        </div>
        <div><p className="text-xs font-bold text-[#8a6d9e] mb-1">اللون</p>
          <div className="flex flex-wrap gap-1.5">{PASTELS.map((c) => <button key={c} onClick={() => setF({ ...f, color: c })} className={`w-8 h-8 rounded-full border-[3px] ${f.color === c ? "border-[#5b3a5e]" : "border-white"} shadow`} style={{ background: c }} />)}</div>
        </div>
        <div><p className="text-xs font-bold text-[#8a6d9e] mb-1">الأيقونة</p>
          <div className="flex flex-wrap gap-1.5">{["BookOpen", "SpellCheck", "Languages", "GraduationCap", "HeartHandshake", "Landmark", "PenLine", "AudioLines", "Feather", "LibraryBig", "Sparkles", "Globe"].map((ic) => (
            <button key={ic} onClick={() => setF({ ...f, icon: ic })} className={`p-2 rounded-xl border-2 ${f.icon === ic ? "border-pink-400 bg-pink-50" : "border-pink-100 bg-white"}`}><Icon name={ic} size={19} color="#e06aa0" /></button>))}
          </div>
        </div>
        <div className="flex gap-2">
          <CuteButton className="bg-pink-500 text-white flex-1 justify-center" onClick={async () => { await onUpdate("modules", module.id, f as any); sfx.chime(); onClose(); }}>حفظ</CuteButton>
          <CuteButton className="bg-red-50 text-red-400" onClick={async () => { if (confirm("Supprimer ce module et tout son contenu ?")) { await onDelete("modules", module.id); onBack(); } }}><Trash2 size={16} /></CuteButton>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Présentations ---------------- */
function Presentations({ module, data, onCreate, onDelete, addPoints }: { module: ModuleT; data: AppData; onCreate: Create; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const files = data.attachments.filter((a) => a.moduleId === module.id);
  const [kind, setKind] = useState("Présentation");
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    if (file.size > 4 * 1024 * 1024) { setMsg("Le fichier est trop lourd (max 4 Mo dans cette version)."); sfx.boop(); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      await onCreate("attachments", { moduleId: module.id, name: file.name, kind, mime: file.type, size: file.size, dataUrl: String(reader.result) });
      sfx.chime(); addPoints(5, `Fichier ajouté : ${file.name}`); setMsg("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="cute-card p-5 mb-4 border-dashed">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center"><Upload className="text-violet-500" /></div>
          <div className="flex-1 min-w-[180px]">
            <p className="font-display font-bold text-[#8a4b7c]">ارفعي عروضك وملفاتك · Mes présentations & slides</p>
            <p className="text-xs text-[#b49cc4]">PowerPoint (.pptx)، PDF، صور… حتى 4 ميغا للملف الواحد. تبقى محفوظة هنا داخل المادة.</p>
          </div>
          <select className="field !w-auto" value={kind} onChange={(e) => setKind(e.target.value)}>
            {["Présentation", "Cours PDF", "Fiche", "Image", "Autre"].map((k) => <option key={k}>{k}</option>)}
          </select>
          <CuteButton className="bg-violet-400 text-white" onClick={() => inputRef.current?.click()}><Upload size={16} /> اختيار ملف</CuteButton>
          <input ref={inputRef} type="file" className="hidden" accept=".ppt,.pptx,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </div>
        {msg && <p className="text-red-400 text-xs mt-2 font-bold">{msg}</p>}
      </div>
      {files.length === 0 && <EmptyState icon="Presentation" text="لا توجد عروض بعد" sub="ارفعي عرض الدرس القادم ليبقى في متناولك دائماً" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((f) => (
          <div key={f.id} className="cute-card p-4 anim-pop">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-pink-100 flex items-center justify-center shrink-0">
                {f.mime.includes("pdf") ? <FileText className="text-red-400" size={22} /> : f.mime.includes("image") ? <Icon name="Image" size={22} color="#4fc3a1" /> : <Presentation className="text-orange-400" size={22} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#5b3a5e] truncate" dir="auto" title={f.name}>{f.name}</p>
                <p className="text-[11px] text-[#b49cc4]">{f.kind} · {(f.size / 1024).toFixed(0)} Ko</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <a href={f.dataUrl} download={f.name} onClick={() => sfx.pop()} className="cute-btn bg-emerald-300 text-emerald-800 px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"><Download size={14} /> تنزيل</a>
              {f.mime.includes("pdf") || f.mime.includes("image") ? (
                <a href={f.dataUrl} target="_blank" rel="noreferrer" className="cute-btn bg-sky-100 text-sky-600 px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1"><Eye size={14} /> معاينة</a>
              ) : null}
              <button className="cute-btn bg-red-50 text-red-400 px-2 py-1.5 text-xs ms-auto" onClick={async () => { if (confirm("Supprimer ce fichier ?")) await onDelete("attachments", f.id); }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Sticky notes ---------------- */
const STICKY_COLORS = ["#fff3a6", "#ffd6e8", "#d8f5d0", "#cdeffd", "#e3dcff", "#ffe3c2"];
function Stickies({ module, data, onCreate, onUpdate, onDelete }: { module: ModuleT; data: AppData; onCreate: Create; onUpdate: Update; onDelete: Remove }) {
  const notes = data.stickies.filter((n) => n.moduleId === module.id);
  const [text, setText] = useState("");
  const [color, setColor] = useState(STICKY_COLORS[0]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  return (
    <div>
      <div className="cute-card p-4 mb-4 flex gap-2 flex-wrap items-center">
        <input className="field flex-1 min-w-[200px]" placeholder="Note rapide… ex : L'enseignant insiste sur ce point !" value={text} onChange={(e) => setText(e.target.value)} dir="auto"
          onKeyDown={async (e) => { if (e.key === "Enter" && text.trim()) { await onCreate("stickies", { moduleId: module.id, text, color }); setText(""); sfx.stick(); } }} />
        <div className="flex gap-1">{STICKY_COLORS.map((c) => <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-md border-2 ${color === c ? "border-[#5b3a5e] scale-110" : "border-white"} shadow`} style={{ background: c }} />)}</div>
        <CuteButton className="bg-amber-300 text-amber-800" onClick={async () => { if (!text.trim()) return; await onCreate("stickies", { moduleId: module.id, text, color }); setText(""); sfx.stick(); }}><Plus size={16} /> ألصقيها</CuteButton>
      </div>
      {notes.length === 0 && <EmptyState icon="StickyNote" text="جدار الملاحظات فارغ" sub="دوّني تنبيهات الأستاذ والواجبات القادمة على ملصقات ملوّنة" />}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes.map((n, i) => (
          <div key={n.id} className="sticky-note relative rounded-md rounded-bl-3xl p-4 pt-6 min-h-[130px] anim-pop" style={{ background: n.color, transform: `rotate(${i % 2 ? 1.6 : -1.6}deg)` }}>
            <span className="washi absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-white/50 rounded-sm" />
            {editing === n.id ? (
              <div>
                <textarea className="w-full bg-white/60 rounded-lg p-1.5 text-sm" rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} dir="auto" autoFocus />
                <button className="cute-btn bg-white/80 text-emerald-600 px-2 py-0.5 text-xs font-bold mt-1" onClick={async () => { await onUpdate("stickies", n.id, { text: editText }); setEditing(null); }}><Check size={13} /> حفظ</button>
              </div>
            ) : (
              <p className="font-hand-fr text-lg leading-snug text-[#5b4a3b] cursor-pointer" dir="auto" onDoubleClick={() => { setEditing(n.id); setEditText(n.text); }} title="Double-clique pour modifier">{n.text}</p>
            )}
            <div className="absolute bottom-1.5 left-1.5 flex gap-1">
              <button className="bg-white/70 rounded-full p-1 text-[#8a6d9e]" onClick={() => { setEditing(n.id); setEditText(n.text); }} aria-label="Modifier"><Pencil size={12} /></button>
              <button className="bg-white/70 rounded-full p-1 text-red-400" onClick={async () => { await onDelete("stickies", n.id); sfx.pop(); }} aria-label="Supprimer"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Exercices ---------------- */
function Exercices({ module, data, onCreate, onDelete, addPoints }: { module: ModuleT; data: AppData; onCreate: Create; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const exNotebooks = data.notebooks.filter((n) => n.moduleId === module.id && n.kind === "Exercices");
  const exPages = data.pages.filter((p) => exNotebooks.some((n) => n.id === p.notebookId));
  const [form, setForm] = useState({ title: "", content: "" });
  const [openId, setOpenId] = useState<number | null>(null);

  const add = async () => {
    if (!form.title.trim()) return;
    let nb = exNotebooks[0];
    if (!nb) nb = await onCreate("notebooks", { moduleId: module.id, title: "Cahier d'exercices", coverColor: "#d8f5d0", coverIcon: "Dumbbell", kind: "Exercices" });
    await onCreate("pages", { notebookId: nb.id, moduleId: module.id, title: form.title, content: form.content, paper: "carreaux", font: "Patrick Hand", ink: "#2f5d50", fontSize: 19, stickers: [], sortOrder: exPages.length });
    setForm({ title: "", content: "" }); sfx.chime(); addPoints(8, `Exercice ajouté : ${form.title}`);
  };

  return (
    <div>
      <div className="cute-card p-4 mb-4 space-y-2">
        <p className="font-display font-bold text-[#8a4b7c] flex items-center gap-2"><Dumbbell size={18} className="text-emerald-400" /> تمرين جديد محلول · Nouvel exercice corrigé</p>
        <input className="field" placeholder="Titre — ex : Exercice 3 p.42 : le discours indirect" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} dir="auto" />
        <textarea className="field" rows={4} placeholder="Énoncé + correction détaillée…" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} dir="auto" />
        <CuteButton className="bg-emerald-400 text-white" onClick={add}><Plus size={16} /> حفظ التمرين في دفتر التمارين</CuteButton>
      </div>
      {exPages.length === 0 && <EmptyState icon="Dumbbell" text="لا توجد تمارين محلولة بعد" sub="احفظي هنا تصحيحات الـ TD والتمارين المهمة قبل الامتحان" />}
      <div className="space-y-3">
        {exPages.map((p) => (
          <div key={p.id} className="cute-card overflow-hidden">
            <button className="w-full flex items-center gap-2 p-4 text-right" onClick={() => { sfx.flip(); setOpenId(openId === p.id ? null : p.id); }}>
              <span className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0"><Dumbbell size={18} className="text-emerald-500" /></span>
              <span className="font-bold text-[#5b3a5e] flex-1" dir="auto">{p.title}</span>
              <Icon name={openId === p.id ? "ChevronUp" : "ChevronDown"} size={18} color="#b49cc4" />
            </button>
            {openId === p.id && (
              <div className="px-4 pb-4">
                <div className="paper-carreaux rounded-2xl border border-emerald-100 p-4 whitespace-pre-wrap" dir="auto" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: 18, color: "#2f5d50", lineHeight: "30px" }}>{p.content || "…"}</div>
                <button className="cute-btn bg-red-50 text-red-400 px-3 py-1 text-xs font-bold mt-2" onClick={async () => { if (confirm("Supprimer cet exercice ?")) await onDelete("pages", p.id); }}><Trash2 size={13} /> حذف</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Glossaire Flash ---------------- */
function Glossaire({ module, data, onCreate, onUpdate, onDelete, addPoints }: { module: ModuleT; data: AppData; onCreate: Create; onUpdate: Update; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const cards = data.flashcards.filter((f) => f.moduleId === module.id);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ term: "", definition: "", example: "" });
  const [filter, setFilter] = useState<"all" | "todo">("all");
  const shown = filter === "all" ? cards : cards.filter((c) => !c.known);
  const pct = cards.length ? Math.round((cards.filter((c) => c.known).length / cards.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <CuteButton className="bg-sky-400 text-white" onClick={() => setShowForm(true)}><Plus size={16} /> بطاقة جديدة</CuteButton>
        <button className={`cute-btn px-3 py-1.5 text-xs font-bold ${filter === "all" ? "bg-[#8a4b7c] text-white" : "bg-white text-[#8a6d9e]"}`} onClick={() => setFilter("all")}>الكل ({cards.length})</button>
        <button className={`cute-btn px-3 py-1.5 text-xs font-bold ${filter === "todo" ? "bg-[#8a4b7c] text-white" : "bg-white text-[#8a6d9e]"}`} onClick={() => setFilter("todo")}>لم أحفظها بعد</button>
        <div className="ms-auto flex items-center gap-2 min-w-[160px]">
          <span className="text-xs font-bold text-[#8a6d9e]">حفظت {pct}%</span>
          <div className="flex-1 h-3 bg-sky-50 border border-sky-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-l from-sky-300 to-emerald-300 transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
      <p className="text-xs text-[#b49cc4] mb-3">اضغطي على البطاقة لكشف التعريف واختبار ذاكرتك، ثم علّميها «حفظتها» عندما تتقنينها.</p>
      {shown.length === 0 && <EmptyState icon="Layers" text={filter === "todo" && cards.length ? "Bravo ! Tu connais toutes tes cartes !" : "لا توجد بطاقات مصطلحات بعد"} sub="أضيفي القواعد والمصطلحات المهمة لمراجعة خاطفة قبل الامتحان" />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((c) => (
          <div key={c.id} onClick={() => { sfx.flip(); setFlipped({ ...flipped, [c.id]: !flipped[c.id] }); }}
            className={`anim-flip cursor-pointer rounded-3xl border-2 p-4 min-h-[150px] relative slot-btn ${flipped[c.id] ? "bg-gradient-to-br from-sky-100 to-emerald-50 border-sky-200" : "bg-white border-pink-100"}`}>
            {c.known && <span className="absolute top-2 left-2 bg-emerald-400 text-white rounded-full p-1"><Check size={13} /></span>}
            {!flipped[c.id] ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Sparkles size={20} className="text-pink-300" />
                <p className="font-display font-bold text-[#5b3a5e]" dir="auto">{c.term}</p>
                <p className="text-[11px] text-[#b49cc4]">Clique pour révéler…</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-sky-700 text-sm" dir="auto">{c.term}</p>
                <p className="text-sm text-[#4a3b52] mt-1" dir="auto">{c.definition}</p>
                {c.example && <p className="text-xs italic text-[#8a6d9e] mt-2 bg-white/70 rounded-xl p-2" dir="auto">« {c.example} »</p>}
              </div>
            )}
            <div className="flex gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
              <button className={`cute-btn px-2.5 py-1 text-[11px] font-bold ${c.known ? "bg-emerald-100 text-emerald-600" : "bg-pink-400 text-white"}`}
                onClick={async () => { await onUpdate("flashcards", c.id, { known: !c.known }); if (!c.known) { sfx.chime(); addPoints(3, `Carte maîtrisée : ${c.term}`); } }}>
                {c.known ? "محفوظة" : "حفظتها !"}
              </button>
              <button className="cute-btn bg-red-50 text-red-400 px-2 py-1 text-[11px] ms-auto" onClick={async () => { await onDelete("flashcards", c.id); }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <Modal title="بطاقة مصطلح جديدة · Nouvelle carte" onClose={() => setShowForm(false)}>
          <div className="space-y-2.5">
            <input className="field" placeholder="Terme / règle — المصطلح أو القاعدة" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} dir="auto" />
            <textarea className="field" rows={3} placeholder="Définition — التعريف" value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} dir="auto" />
            <input className="field" placeholder="Exemple (optionnel)" value={form.example} onChange={(e) => setForm({ ...form, example: e.target.value })} dir="auto" />
            <CuteButton className="bg-sky-400 text-white w-full justify-center" onClick={async () => { if (!form.term.trim()) return; await onCreate("flashcards", { ...form, moduleId: module.id, known: false }); setForm({ term: "", definition: "", example: "" }); setShowForm(false); sfx.chime(); addPoints(2, "Carte ajoutée au glossaire"); }}><Plus size={16} /> إضافة البطاقة</CuteButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Quiz ---------------- */
function Quiz({ module, data, onCreate, onDelete, addPoints }: { module: ModuleT; data: AppData; onCreate: Create; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const questions = data.quiz.filter((q) => q.moduleId === module.id);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });

  const start = () => { setIdx(0); setScore(0); setPicked(null); setFinished(false); setPlaying(true); sfx.flip(); };
  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === questions[idx].correctIndex) { setScore((s) => s + 1); sfx.chime(); } else sfx.boop();
  };
  const next = () => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
      addPoints(score * 5, `Quiz ${module.short} : ${score}/${questions.length}`);
    } else { setIdx(idx + 1); setPicked(null); sfx.flip(); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <CuteButton className="bg-violet-400 text-white" onClick={() => setShowForm(true)}><Plus size={16} /> سؤال جديد</CuteButton>
        {questions.length > 0 && !playing && <CuteButton className="bg-pink-500 text-white" onClick={start}><Icon name="Play" size={16} /> ابدئي الكويز ({questions.length} سؤال)</CuteButton>}
        {playing && <CuteButton className="bg-white text-[#8a6d9e]" onClick={() => setPlaying(false)}><RotateCcw size={15} /> إنهاء</CuteButton>}
      </div>

      {questions.length === 0 && <EmptyState icon="CircleHelp" text="لا أسئلة بعد في كويز هذه المادة" sub="أنشئي أسئلتك الخاصة من ملخصاتك — أفضل طريقة لتثبيت المعلومات !" />}

      {playing && !finished && questions[idx] && (
        <div className="cute-card p-5 anim-pop max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-[#b49cc4]">
            <span>السؤال {idx + 1} / {questions.length}</span><span>النقاط : {score}</span>
          </div>
          <div className="h-2.5 bg-violet-50 rounded-full mt-2 overflow-hidden"><div className="h-full bg-gradient-to-l from-violet-300 to-pink-300 transition-all" style={{ width: `${((idx) / questions.length) * 100}%` }} /></div>
          <p className="font-display font-bold text-lg text-[#5b3a5e] mt-4" dir="auto">{questions[idx].question}</p>
          <div className="grid gap-2 mt-4">
            {(questions[idx].options as string[]).map((op, i) => {
              const isCorrect = i === questions[idx].correctIndex;
              const cls = picked === null ? "bg-pink-50 hover:bg-pink-100 border-pink-100 text-[#5b3a5e]"
                : isCorrect ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                : i === picked ? "bg-red-100 border-red-300 text-red-600" : "bg-gray-50 border-gray-100 text-gray-400";
              return (
                <button key={i} onClick={() => pick(i)} className={`text-right border-2 rounded-2xl px-4 py-2.5 font-bold text-sm transition slot-btn ${cls}`} dir="auto">
                  <span className="inline-flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-white/80 inline-flex items-center justify-center text-xs">{["A", "B", "C", "D"][i]}</span>{op}</span>
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="anim-pop mt-4">
              {questions[idx].explanation && <p className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-sm text-amber-700" dir="auto">{questions[idx].explanation}</p>}
              <CuteButton className="bg-pink-500 text-white mt-3" onClick={next}>{idx + 1 >= questions.length ? "النتيجة" : "السؤال التالي"}</CuteButton>
            </div>
          )}
        </div>
      )}

      {playing && finished && (
        <div className="cute-card p-6 text-center anim-pop max-w-lg mx-auto">
          <Trophy size={46} className="mx-auto text-amber-400 anim-wiggle" />
          <p className="font-display font-extrabold text-2xl text-[#5b3a5e] mt-2" dir="ltr">{score} / {questions.length}</p>
          <p className="text-[#8a6d9e] mt-1">{score === questions.length ? "Parfait ! Tu maîtrises ce module !" : score >= questions.length / 2 ? "Très bien ! Encore un petit effort sur les erreurs." : "Courage ! Relis tes fiches et réessaie, tu vas y arriver."}</p>
          <p className="text-xs text-pink-400 font-bold mt-2">+{score * 5} نقطة لشجرة الإنجازات</p>
          <div className="flex gap-2 justify-center mt-4">
            <CuteButton className="bg-pink-500 text-white" onClick={start}><RotateCcw size={15} /> إعادة اللعب</CuteButton>
            <CuteButton className="bg-violet-100 text-violet-600" onClick={() => setPlaying(false)}>قائمة الأسئلة</CuteButton>
          </div>
        </div>
      )}

      {!playing && questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="cute-card p-3.5 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-display font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="flex-1 text-sm font-bold text-[#5b3a5e] truncate" dir="auto">{q.question}</p>
              <span className="text-[11px] bg-emerald-50 text-emerald-600 rounded-full px-2 py-1 font-bold hidden sm:inline" dir="auto">{(q.options as string[])[q.correctIndex]}</span>
              <button className="text-red-300 hover:text-red-500" onClick={async () => { await onDelete("quiz", q.id); }} aria-label="Supprimer"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="سؤال كويز جديد · Nouvelle question" onClose={() => setShowForm(false)} wide>
          <div className="space-y-2.5">
            <textarea className="field" rows={2} placeholder="La question…" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} dir="auto" />
            {form.options.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => setForm({ ...form, correctIndex: i })} className={`cute-btn w-8 h-8 shrink-0 font-bold text-sm ${form.correctIndex === i ? "bg-emerald-400 text-white" : "bg-pink-50 text-pink-400"}`} title="Marquer comme bonne réponse">{["A", "B", "C", "D"][i]}</button>
                <input className="field" placeholder={`Choix ${["A", "B", "C", "D"][i]}`} value={op} dir="auto"
                  onChange={(e) => { const options = [...form.options]; options[i] = e.target.value; setForm({ ...form, options }); }} />
              </div>
            ))}
            <p className="text-[11px] text-[#b49cc4]">اضغطي على الحرف الأخضر لتحديد الإجابة الصحيحة.</p>
            <input className="field" placeholder="Explication de la réponse (optionnel)" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} dir="auto" />
            <CuteButton className="bg-violet-400 text-white w-full justify-center" onClick={async () => {
              if (!form.question.trim() || form.options.some((o) => !o.trim())) return;
              await onCreate("quiz", { ...form, moduleId: module.id });
              setForm({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });
              setShowForm(false); sfx.chime(); addPoints(3, "Question de quiz créée");
            }}><Plus size={16} /> إضافة السؤال</CuteButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Moyennes ---------------- */
function Moyennes({ module, data, onCreate, onDelete, addPoints }: { module: ModuleT; data: AppData; onCreate: Create; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const my = data.grades.filter((g) => g.moduleId === module.id);
  const avg = moduleAverage(my);
  const [form, setForm] = useState({ label: "", score: "", outOf: "20", kind: "CC", date: new Date().toISOString().slice(0, 10) });
  const best = useMemo(() => (my.length ? Math.max(...my.map((g) => (g.score / g.outOf) * 20)) : null), [my]);

  const allAvgs = data.modules.map((m) => ({ m, avg: moduleAverage(data.grades.filter((g) => g.moduleId === m.id)) })).filter((x) => x.avg !== null);
  const semAvg = allAvgs.length ? allAvgs.reduce((a, x) => a + (x.avg as number) * (x.m.coefficient || 1), 0) / allAvgs.reduce((a, x) => a + (x.m.coefficient || 1), 0) : null;

  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-4">
      <div>
        <div className="cute-card p-4 mb-4 space-y-2">
          <p className="font-display font-bold text-[#8a4b7c]">تسجيل نقطة جديدة · Nouvelle note</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <input className="field col-span-2" placeholder="Ex : Interrogation 2" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} dir="auto" />
            <input className="field" type="number" step="0.25" placeholder="النقطة" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} />
            <input className="field" type="number" placeholder="على" value={form.outOf} onChange={(e) => setForm({ ...form, outOf: e.target.value })} />
            <select className="field" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {["CC", "Examen", "TP", "Exposé"].map((k) => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input className="field !w-auto" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <CuteButton className="bg-pink-500 text-white" onClick={async () => {
              if (form.score === "") return;
              await onCreate("grades", { moduleId: module.id, label: form.label || "Évaluation", score: Number(form.score), outOf: Number(form.outOf) || 20, kind: form.kind, date: form.date });
              setForm({ ...form, label: "", score: "" }); sfx.chime(); addPoints(4, "Note enregistrée");
            }}><Plus size={16} /> تسجيل</CuteButton>
          </div>
          <p className="text-[11px] text-[#b49cc4]">المعدل يُحسب : أعمال موجهة/مراقبة مستمرة 40% + امتحان 60% عند توفرهما معاً.</p>
        </div>

        {my.length === 0 && <EmptyState icon="ChartColumn" text="لا نقاط مسجلة بعد في هذه المادة" sub="سجّلي نقاط المراقبة المستمرة والامتحانات لمتابعة تقدمك" />}
        <div className="space-y-2">
          {[...my].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((g) => {
            const n20 = (g.score / g.outOf) * 20;
            return (
              <div key={g.id} className="cute-card p-3.5 flex items-center gap-3">
                <span className={`w-14 text-center rounded-2xl py-1.5 font-display font-extrabold ${n20 >= 14 ? "bg-emerald-100 text-emerald-600" : n20 >= 10 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`} dir="ltr">{g.score}/{g.outOf}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#5b3a5e] truncate" dir="auto">{g.label}</p>
                  <p className="text-[11px] text-[#b49cc4]">{g.kind} · {g.date}</p>
                </div>
                <div className="hidden sm:block w-28 h-2.5 bg-pink-50 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-l from-pink-300 to-violet-300" style={{ width: `${(n20 / 20) * 100}%` }} /></div>
                <button className="text-red-300 hover:text-red-500" onClick={async () => { await onDelete("grades", g.id); }} aria-label="Supprimer"><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="cute-card p-5 text-center">
          <p className="text-xs font-bold text-[#b49cc4]">معدلي في · {module.short}</p>
          <p className="font-display font-extrabold text-4xl text-[#d14d7e] mt-1" dir="ltr">{avg !== null ? `${avg.toFixed(2)}/20` : "—"}</p>
          {best !== null && <p className="text-xs text-[#8a6d9e] mt-1">أفضل نقطة : <span dir="ltr" className="font-bold">{best.toFixed(1)}/20</span></p>}
          {avg !== null && <p className="text-sm font-bold mt-2 text-[#8a4b7c]">{avg >= 16 ? "Excellent travail, continue ainsi !" : avg >= 12 ? "Bon travail, tu progresses !" : avg >= 10 ? "Tu peux y arriver, accroche-toi !" : "Ne lâche rien, chaque effort compte !"}</p>}
        </div>
        <div className="cute-card p-5">
          <p className="font-display font-bold text-[#8a4b7c] text-sm mb-3">معدلاتي في كل المواد</p>
          {allAvgs.length === 0 && <p className="text-xs text-[#b49cc4]">لا توجد نقاط بعد في أي مادة.</p>}
          <div className="space-y-2.5">
            {allAvgs.map(({ m, avg: a }) => (
              <div key={m.id}>
                <div className="flex justify-between text-xs font-bold"><span className="text-[#5b3a5e]" dir="auto">{m.short || m.name}</span><span dir="ltr">{(a as number).toFixed(2)}/20</span></div>
                <div className="h-2.5 bg-pink-50 rounded-full overflow-hidden mt-0.5"><div className="h-full rounded-full" style={{ width: `${((a as number) / 20) * 100}%`, background: m.color === "#fff3a6" ? "#f6b93b" : "#e06aa0" }} /></div>
              </div>
            ))}
          </div>
          {semAvg !== null && (
            <div className="mt-4 bg-[#8a4b7c] text-white rounded-2xl p-3 text-center">
              <p className="text-[11px] opacity-80">المعدل المرجّح بالمعاملات (تقديري)</p>
              <p className="font-display font-extrabold text-2xl" dir="ltr">{semAvg.toFixed(2)}/20</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
