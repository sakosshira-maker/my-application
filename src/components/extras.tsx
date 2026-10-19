"use client";
import { useState } from "react";
import { Plus, Trash2, Backpack, CircleHelp, Check, Pencil, School, Sprout, Trophy, Timer } from "lucide-react";
import type { AppData } from "@/lib/app";
import { sfx } from "@/lib/sound";
import { Modal, CuteButton, EmptyState, Tree } from "./ui";

type Create = (resource: string, body: Record<string, unknown>) => Promise<any>;
type Update = (resource: string, id: number, body: Record<string, unknown>) => Promise<any>;
type Remove = (resource: string, id: number) => Promise<void>;

const STAGE_CATS = ["Observation", "Pratique accompagnée", "Pratique autonome", "Pédagogie", "Réunion / Conseil", "Autre"];
const CAT_COLORS: Record<string, string> = {
  "Observation": "#cdeffd", "Pratique accompagnée": "#d8f5d0", "Pratique autonome": "#ffd6e8",
  "Pédagogie": "#e3dcff", "Réunion / Conseil": "#ffe3c2", "Autre": "#fff3a6",
};

export function StagePage({ data, onCreate, onUpdate, onDelete, addPoints }: { data: AppData; onCreate: Create; onUpdate: Update; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", category: "Observation", school: "", date: new Date().toISOString().slice(0, 10), content: "" });
  const [catFilter, setCatFilter] = useState("Toutes");
  const [search, setSearch] = useState("");
  const entries = data.stage.filter((e) => (catFilter === "Toutes" || e.category === catFilter) &&
    (e.title + e.content + e.school).toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    if (!form.title.trim()) return;
    if (editingId) await onUpdate("stage", editingId, form as any);
    else { await onCreate("stage", form as any); addPoints(6, "Journal de stage enrichi"); }
    setForm({ title: "", category: "Observation", school: "", date: new Date().toISOString().slice(0, 10), content: "" });
    setEditingId(null); setShowForm(false); sfx.chime();
  };

  return (
    <div className="anim-page">
      <div className="cute-card p-5 mb-4 relative overflow-hidden">
        <div className="washi absolute top-2 left-10 w-24 h-5 bg-emerald-300/60 rotate-3 rounded-sm" />
        <h3 className="font-display font-extrabold text-xl text-[#8a4b7c] flex items-center gap-2"><Backpack className="text-emerald-400" /> الأعمال التربوية والستاج <span className="text-sm font-normal text-[#b49cc4]">· Stage & Pédagogie</span></h3>
        <p className="text-sm text-[#8a6d9e] mt-1">مذكّرتك الميدانية : ملاحظات الحصص في الثانوية، شبكات الملاحظة، المعلومات البيداغوجية التي تجمعينها وكل ما يفيدك في تقرير الستاج.</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <CuteButton className="bg-emerald-400 text-white" onClick={() => { setEditingId(null); setShowForm(true); }}><Plus size={16} /> مذكّرة جديدة</CuteButton>
          <input className="field !w-auto flex-1 min-w-[160px]" placeholder="Rechercher dans mon journal…" value={search} onChange={(e) => setSearch(e.target.value)} dir="auto" />
        </div>
        <div className="flex gap-1.5 flex-wrap mt-3">
          {["Toutes", ...STAGE_CATS].map((c) => (
            <button key={c} onClick={() => { sfx.pop(); setCatFilter(c); }} className={`cute-btn px-3 py-1 text-[11px] font-bold ${catFilter === c ? "bg-[#8a4b7c] text-white" : "bg-pink-50 text-[#8a6d9e]"}`}>{c}</button>
          ))}
        </div>
      </div>

      {entries.length === 0 && <EmptyState icon="Backpack" text="مذكّرتك الميدانية فارغة" sub="ابدئي بتدوين أول حصة ملاحظة في الثانوية" />}
      <div className="grid md:grid-cols-2 gap-4">
        {entries.map((e) => (
          <article key={e.id} className="cute-card overflow-hidden anim-pop">
            <div className="p-4 pb-2" style={{ background: `linear-gradient(120deg, ${CAT_COLORS[e.category] || "#ffd6e8"}, #fff 130%)` }}>
              <div className="flex items-start gap-2">
                <h4 className="font-display font-bold text-[#5b3a5e] flex-1 leading-snug" dir="auto">{e.title}</h4>
                <span className="bg-white/80 text-[11px] font-bold text-[#8a4b7c] rounded-full px-2 py-0.5 shrink-0">{e.category}</span>
              </div>
              <p className="text-[11px] text-[#8a6d9e] mt-1 flex items-center gap-2">
                {e.school && <span className="inline-flex items-center gap-1"><School size={12} />{e.school}</span>}<span dir="ltr">{e.date}</span>
              </p>
            </div>
            <p className="p-4 pt-2 text-sm text-[#4a3b52] leading-relaxed whitespace-pre-wrap paper-points rounded-b-[26px]" dir="auto">{e.content}</p>
            <div className="px-4 pb-3 flex gap-2">
              <button className="cute-btn bg-violet-100 text-violet-600 px-3 py-1 text-xs font-bold" onClick={() => { setEditingId(e.id); setForm({ title: e.title, category: e.category, school: e.school, date: e.date, content: e.content }); setShowForm(true); }}><Pencil size={13} /> تعديل</button>
              <button className="cute-btn bg-red-50 text-red-400 px-3 py-1 text-xs font-bold" onClick={async () => { if (confirm("Supprimer cette entrée ?")) await onDelete("stage", e.id); }}><Trash2 size={13} /> حذف</button>
            </div>
          </article>
        ))}
      </div>

      {showForm && (
        <Modal title={editingId ? "تعديل المذكّرة" : "مذكّرة ميدانية جديدة"} onClose={() => setShowForm(false)} wide>
          <div className="space-y-2.5">
            <input className="field" placeholder="Titre — ex : Observation d'une séance de compréhension écrite (1AS)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} dir="auto" />
            <div className="grid grid-cols-3 gap-2">
              <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{STAGE_CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input className="field" placeholder="Lycée / établissement" value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} dir="auto" />
              <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <textarea className="field paper-points" rows={7} placeholder="Ce que j'ai observé, appris, ressenti… Les techniques de l'enseignant(e), les réactions des élèves, ce que je retiens pour ma future classe." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} dir="auto" />
            <CuteButton className="bg-emerald-400 text-white w-full justify-center" onClick={save}><Check size={16} /> حفظ في مذكّرتي</CuteButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function DoubtsPage({ data, onCreate, onUpdate, onDelete, addPoints }: { data: AppData; onCreate: Create; onUpdate: Update; onDelete: Remove; addPoints: (n: number, r: string) => void }) {
  const [form, setForm] = useState({ question: "", moduleId: "" as string });
  const [answerEdit, setAnswerEdit] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const open = data.doubts.filter((d) => !d.resolved);
  const done = data.doubts.filter((d) => d.resolved);
  const modName = (id: number | null) => data.modules.find((m) => m.id === id)?.short || "Général";

  const renderDoubt = (d: AppData["doubts"][number]) => (
    <div key={d.id} className={`cute-card p-4 anim-pop ${d.resolved ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <button onClick={async () => { await onUpdate("doubts", d.id, { resolved: !d.resolved }); if (!d.resolved) { sfx.chime(); addPoints(5, "Question clarifiée"); } }}
          className={`w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition ${d.resolved ? "bg-emerald-400 border-emerald-400 text-white" : "border-dashed border-pink-300 text-pink-300 hover:scale-110"}`} aria-label="Marquer comme clarifié">
          {d.resolved ? <Check size={16} /> : <CircleHelp size={16} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-[#5b3a5e] ${d.resolved ? "line-through decoration-pink-300" : ""}`} dir="auto">{d.question}</p>
          <span className="text-[11px] bg-violet-50 text-violet-500 rounded-full px-2 py-0.5 font-bold">{modName(d.moduleId)}</span>
          {d.answer && answerEdit !== d.id && <p className="mt-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-sm text-emerald-800" dir="auto">{d.answer}</p>}
          {answerEdit === d.id && (
            <div className="mt-2 flex gap-2">
              <textarea className="field" rows={2} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="La réponse que j'ai trouvée / que le prof m'a donnée…" dir="auto" autoFocus />
              <CuteButton className="bg-emerald-400 text-white self-start" onClick={async () => { await onUpdate("doubts", d.id, { answer: answerText, resolved: true }); setAnswerEdit(null); sfx.chime(); addPoints(5, "Question clarifiée"); }}><Check size={15} /></CuteButton>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button className="cute-btn bg-sky-50 text-sky-500 p-1.5" onClick={() => { setAnswerEdit(d.id); setAnswerText(d.answer); }} aria-label="Ajouter la réponse"><Pencil size={14} /></button>
          <button className="cute-btn bg-red-50 text-red-400 p-1.5" onClick={async () => { await onDelete("doubts", d.id); }} aria-label="Supprimer"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="anim-page">
      <div className="cute-card p-5 mb-4 relative overflow-hidden">
        <div className="washi absolute top-2 left-10 w-24 h-5 bg-sky-300/60 rotate-[-3deg] rounded-sm" />
        <h3 className="font-display font-extrabold text-xl text-[#8a4b7c] flex items-center gap-2"><CircleHelp className="text-sky-400" /> علامات الاستفهام <span className="text-sm font-normal text-[#b49cc4]">· À clarifier</span></h3>
        <p className="text-sm text-[#8a6d9e] mt-1">كل نقطة لم تفهميها في المحاضرة تُدوَّن هنا حتى لا تضيع — وعندما تجدين الجواب (من الأستاذ أو بحثك) سجّليه وعلّميها كمُوضَّحة.</p>
        <div className="flex gap-2 flex-wrap mt-3">
          <input className="field flex-1 min-w-[220px]" placeholder="Qu'est-ce que je n'ai pas compris ?" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} dir="auto"
            onKeyDown={async (e) => { if (e.key === "Enter" && form.question.trim()) { await onCreate("doubts", { question: form.question, moduleId: form.moduleId ? Number(form.moduleId) : null, answer: "", resolved: false }); setForm({ ...form, question: "" }); sfx.pop(); } }} />
          <select className="field !w-auto" value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: e.target.value })}>
            <option value="">Général</option>
            {data.modules.map((m) => <option key={m.id} value={m.id}>{m.short || m.name}</option>)}
          </select>
          <CuteButton className="bg-sky-400 text-white" onClick={async () => { if (!form.question.trim()) return; await onCreate("doubts", { question: form.question, moduleId: form.moduleId ? Number(form.moduleId) : null, answer: "", resolved: false }); setForm({ ...form, question: "" }); sfx.chime(); }}><Plus size={16} /> تدوين</CuteButton>
        </div>
      </div>

      <p className="font-display font-bold text-[#8a4b7c] mb-2">أسئلة تنتظر التوضيح ({open.length})</p>
      {open.length === 0 && <EmptyState icon="Sparkles" text="Tout est clair pour le moment !" sub="رائع ! لا توجد نقاط غامضة عالقة" />}
      <div className="space-y-3 mb-6">{open.map(renderDoubt)}</div>
      {done.length > 0 && (<>
        <p className="font-display font-bold text-emerald-600 mb-2">تم توضيحها ({done.length})</p>
        <div className="space-y-3">{done.map(renderDoubt)}</div>
      </>)}
    </div>
  );
}

const MILESTONES = [
  { pts: 20, label: "Première pousse", desc: "بدأت رحلتك في الدفتر" },
  { pts: 80, label: "Jeune arbre", desc: "دفاترك تنمو ورفيقك يرتدي وشاحه" },
  { pts: 180, label: "Arbre fleuri", desc: "رفيقك يمسك كتابه الأول" },
  { pts: 320, label: "Pleine floraison", desc: "رفيقك يرتدي نظارات الأستاذة" },
  { pts: 500, label: "Étoile de la réussite", desc: "قبعة التخرج لرفيقك ونجمة فوق الشجرة" },
];

export function TreePage({ data }: { data: AppData }) {
  const points = data.progress.points;
  const next = MILESTONES.find((m) => points < m.pts);
  const stats = [
    { label: "صفحة مكتوبة", value: data.pages.length },
    { label: "بطاقة محفوظة", value: data.flashcards.filter((f) => f.known).length },
    { label: "أسئلة وُضّحت", value: data.doubts.filter((d) => d.resolved).length },
    { label: "مذكّرة ستاج", value: data.stage.length },
    { label: "جلسة تركيز", value: data.progress.pomodoros },
  ];
  return (
    <div className="anim-page grid lg:grid-cols-[1fr,340px] gap-4">
      <div className="cute-card p-5 text-center relative overflow-hidden">
        <div className="washi absolute top-2 right-10 w-24 h-5 bg-pink-300/60 rotate-2 rounded-sm" />
        <h3 className="font-display font-extrabold text-xl text-[#8a4b7c] flex items-center justify-center gap-2"><Sprout className="text-emerald-400" /> شجرة إنجازاتي · Mon arbre de réussite</h3>
        <p className="text-sm text-[#8a6d9e]">كل صفحة تحفظينها، بطاقة تتقنينها أو جلسة تركيز تكملينها تسقي شجرتك… راقبيها تزهر !</p>
        <div className="my-2"><Tree points={points} /></div>
        <p className="font-display font-extrabold text-3xl text-[#d14d7e]" dir="ltr">{points} points</p>
        {next ? (
          <div className="max-w-sm mx-auto mt-2">
            <p className="text-xs font-bold text-[#8a6d9e]">الهدف التالي : {next.label} — {next.desc} ({next.pts} نقطة)</p>
            <div className="h-3.5 bg-pink-50 border border-pink-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-l from-emerald-300 to-pink-300 transition-all" style={{ width: `${Math.min(100, (points / next.pts) * 100)}%` }} />
            </div>
          </div>
        ) : <p className="font-bold text-amber-500 mt-1 flex items-center justify-center gap-1"><Trophy size={17} /> شجرتك في كامل إزهارها — مبروك يا أستاذة المستقبل !</p>}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-pink-50/70 border border-pink-100 rounded-2xl p-3">
              <p className="font-display font-extrabold text-xl text-[#8a4b7c]" dir="ltr">{s.value}</p>
              <p className="text-[11px] text-[#b49cc4] font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="cute-card p-5">
          <p className="font-display font-bold text-[#8a4b7c] mb-3 flex items-center gap-2"><Trophy size={17} className="text-amber-400" /> مراحل النمو</p>
          <div className="space-y-2.5">
            {MILESTONES.map((m) => {
              const reached = points >= m.pts;
              return (
                <div key={m.pts} className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${reached ? "bg-emerald-50 border-emerald-200" : "bg-white border-dashed border-pink-100 opacity-70"}`}>
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${reached ? "bg-emerald-400 text-white" : "bg-pink-50 text-pink-300"}`}>{reached ? <Check size={17} /> : <Sprout size={17} />}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-[#5b3a5e]">{m.label}</p>
                    <p className="text-[11px] text-[#b49cc4]">{m.desc}</p>
                  </div>
                  <span className="font-display font-bold text-sm text-[#8a6d9e]" dir="ltr">{m.pts}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#b49cc4] mt-3 flex items-center gap-1"><Timer size={12} /> كيف أكسب النقاط ؟ حفظ صفحة +10 · تمرين +8 · مذكّرة ستاج +6 · جلسة تركيز +15 · إجابة كويز صحيحة +5 · بطاقة محفوظة +3</p>
        </div>
        <div className="cute-card p-5">
          <p className="font-display font-bold text-[#8a4b7c] mb-2">آخر إنجازاتي</p>
          {!(data.progress.data.history?.length) && <p className="text-xs text-[#b49cc4]">ستظهر إنجازاتك هنا خطوة بخطوة.</p>}
          <ul className="space-y-1.5 max-h-56 overflow-y-auto">
            {[...(data.progress.data.history || [])].reverse().slice(0, 14).map((h, i) => (
              <li key={i} className="text-xs bg-pink-50/70 rounded-xl px-3 py-2 text-[#8a6d9e] font-bold" dir="auto">{h}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
