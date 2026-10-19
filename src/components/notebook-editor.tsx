"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Plus, Trash2, Save, Printer, ChevronRight, ChevronLeft, Heart, Mic, Square,
  Play, Pause, Type, ListPlus, CheckSquare, Sparkles, BookPlus, FilePlus2, Eraser,
} from "lucide-react";
import type { NotebookT, PageT, VoiceT, Sticker, ModuleT } from "@/lib/app";
import { FONTS, PAPERS, INKS, STICKERS, PASTELS, printPages } from "@/lib/app";
import { NOTEBOOK_COVERS } from "@/lib/constants";
import { sfx } from "@/lib/sound";
import { Icon, Modal, CuteButton, EmptyState } from "./ui";
import FrenchTutor from "./FrenchTutor";
import SummaryFinishButton from "./SummaryFinishButton";
import { correctFrench, type Correction } from "@/lib/frenchCorrector";
import { clearDraftSnapshot, readDraftSnapshot, useAutosave, usePersistentState } from "@/lib/persistence";

type Create = (resource: string, body: Record<string, unknown>) => Promise<any>;
type Update = (resource: string, id: number, body: Record<string, unknown>) => Promise<any>;
type Remove = (resource: string, id: number) => Promise<void>;

const STICKER_COLORS = ["#ff7bac", "#f6b93b", "#9b7ede", "#4fc3a1", "#5aa9e6", "#ff8c69"];

export default function NotebookEditor({
  module, notebooks, pages, voice, onCreate, onUpdate, onDelete, addPoints,
}: {
  module: ModuleT; notebooks: NotebookT[]; pages: PageT[]; voice: VoiceT[];
  onCreate: Create; onUpdate: Update; onDelete: Remove; addPoints: (n: number, reason: string) => void;
}) {
  const myNotebooks = notebooks.filter((n) => n.moduleId === module.id);
  const [nbId, setNbId] = usePersistentState<number | null>(`nb:${module.id}`, null);
  const activeNb = myNotebooks.find((n) => n.id === nbId) || myNotebooks[0];
  const nbPages = pages.filter((p) => p.notebookId === activeNb?.id).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const [pageIdx, setPageIdx] = usePersistentState<number>(`page:${module.id}`, 0);
  const page = nbPages[Math.min(pageIdx, Math.max(0, nbPages.length - 1))];

  const [draft, setDraft] = useState<PageT | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showNewNb, setShowNewNb] = useState(false);
  const [nbForm, setNbForm] = useState({ title: "", kind: "Cours", coverColor: NOTEBOOK_COVERS[1], coverIcon: "NotebookPen" });
  const [selectedSticker, setSelectedSticker] = useState<number | null>(null);
  const [liveErrors, setLiveErrors] = useState<Correction[]>([]);
  const [showLiveErrors, setShowLiveErrors] = usePersistentState(`errors-visible:${module.id}`, true);
  const [recovered, setRecovered] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ idx: number } | null>(null);

  // تحليل لحظي للأخطاء أثناء الكتابة
  const analyzeText = (text: string) => {
    if (!text || text.trim().length < 3) { setLiveErrors([]); return; }
    const result = correctFrench(text);
    setLiveErrors(result.corrections);
  };

  useEffect(() => {
    if (!page) { setDraft(null); setRecovered(false); return; }
    const serverCopy: PageT = { ...page, stickers: [...(page.stickers || [])] };
    // Recover work typed before a refresh or an accidental close.
    const snapshot = readDraftSnapshot<PageT>(`page-${page.id}`);
    const isAhead = snapshot && typeof snapshot.content === "string" &&
      (snapshot.content !== page.content || snapshot.title !== page.title ||
        JSON.stringify(snapshot.stickers || []) !== JSON.stringify(page.stickers || []));
    setDraft(isAhead ? { ...serverCopy, ...snapshot, id: page.id, notebookId: page.notebookId } : serverCopy);
    setRecovered(Boolean(isAhead));
    setDirty(Boolean(isAhead));
    setSelectedSticker(null);
    analyzeText((isAhead ? snapshot!.content : page.content) || "");
  }, [page?.id, page?.content, page?.title]); // eslint-disable-line
  // Only reset to the first page when the notebook truly changes — never on mount,
  // otherwise the page you were reading last time would be forgotten.
  const previousNotebook = useRef<number | null>(null);
  useEffect(() => {
    const current = activeNb?.id ?? null;
    if (previousNotebook.current === null) { previousNotebook.current = current; return; }
    if (previousNotebook.current !== current) { previousNotebook.current = current; setPageIdx(0); }
  }, [activeNb?.id]); // eslint-disable-line

  const upd = (patch: Partial<PageT>) => { setDraft((d) => (d ? { ...d, ...patch } : d)); setDirty(true); setRecovered(false); };

  const persistPage = async () => {
    if (!draft) return;
    await onUpdate("pages", draft.id, {
      title: draft.title, content: draft.content, paper: draft.paper, font: draft.font,
      ink: draft.ink, fontSize: draft.fontSize, stickers: draft.stickers,
    });
    clearDraftSnapshot(`page-${draft.id}`);
  };

  const save = async () => {
    if (!draft) return;
    await persistPage();
    setDirty(false);
    sfx.chime();
    addPoints(10, `Page enregistrée : ${draft.title}`);
  };

  // كل كلمة تُحفظ تلقائياً: لا شيء يُفقد عند تحديث الصفحة أو إغلاق التبويب
  const { status: saveStatus, flush: flushSave } = useAutosave(
    draft ? `page-${draft.id}` : "no-page",
    draft,
    async (value) => {
      if (!value) return;
      await onUpdate("pages", value.id, {
        title: value.title, content: value.content, paper: value.paper, font: value.font,
        ink: value.ink, fontSize: value.fontSize, stickers: value.stickers,
      });
      clearDraftSnapshot(`page-${value.id}`);
    },
    1500,
    Boolean(draft),
  );

  const addPage = async () => {
    if (!activeNb) return;
    const p = await onCreate("pages", {
      notebookId: activeNb.id, moduleId: module.id, title: "Nouvelle page", content: "",
      paper: "seyes", font: "Caveat", ink: "#3b4a6b", fontSize: 21, stickers: [], sortOrder: nbPages.length,
    });
    sfx.flip();
    setPageIdx(nbPages.length);
    return p;
  };

  const addNotebook = async () => {
    if (!nbForm.title.trim()) return;
    const nb = await onCreate("notebooks", { ...nbForm, moduleId: module.id });
    await onCreate("pages", { notebookId: nb.id, moduleId: module.id, title: "Première page", content: "", paper: "seyes", font: "Caveat", ink: "#3b4a6b", fontSize: 21, stickers: [], sortOrder: 0 });
    setNbId(nb.id); setShowNewNb(false); setNbForm({ title: "", kind: "Cours", coverColor: NOTEBOOK_COVERS[Math.floor(Math.random() * NOTEBOOK_COVERS.length)], coverIcon: "NotebookPen" });
    sfx.chime(); addPoints(5, `Nouveau cahier : ${nb.title}`);
  };

  const addSticker = (icon: string) => {
    if (!draft) return;
    const st: Sticker = { icon, x: 15 + Math.random() * 55, y: 8 + Math.random() * 30, color: STICKER_COLORS[Math.floor(Math.random() * STICKER_COLORS.length)], size: 34, rot: Math.round(Math.random() * 24 - 12) };
    upd({ stickers: [...draft.stickers, st] });
    sfx.stick();
  };

  const onStickerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !paperRef.current || !draft) return;
    const rect = paperRef.current.getBoundingClientRect();
    const x = Math.min(96, Math.max(2, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(95, Math.max(2, ((e.clientY - rect.top) / rect.height) * 100));
    const stickers = draft.stickers.map((s, i) => (i === dragRef.current!.idx ? { ...s, x, y } : s));
    setDraft({ ...draft, stickers }); setDirty(true);
  };

  const insertText = (txt: string) => { if (draft) upd({ content: (draft.content ? draft.content + "\n" : "") + txt }); sfx.pop(); };

  const flipTo = (idx: number) => { if (idx >= 0 && idx < nbPages.length) { sfx.flip(); setPageIdx(idx); } };

  return (
    <div>
      {/* Bookshelf */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="font-display font-bold text-[#8a4b7c] flex items-center gap-1.5"><Icon name="LibraryBig" size={19} /> رفّ دفاتري · Ma bibliothèque</span>
        <CuteButton className="bg-violet-400 text-white !px-3 !py-1.5 text-xs" onClick={() => { setNbForm((f) => ({ ...f, coverColor: NOTEBOOK_COVERS[(myNotebooks.length + 1) % NOTEBOOK_COVERS.length] })); setShowNewNb(true); }}><BookPlus size={15} /> دفتر جديد</CuteButton>
      </div>

      {myNotebooks.length === 0 && <EmptyState icon="NotebookPen" text="لا يوجد دفتر بعد لهذه المادة" sub="أنشئي دفتراً للدروس، وآخر للملخصات، وثالثاً للتمارين — وخصّصي غلاف كل دفتر كما تحبين" />}

      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1">
        {myNotebooks.map((nb) => {
          const count = pages.filter((p) => p.notebookId === nb.id).length;
          const active = activeNb?.id === nb.id;
          return (
            <button key={nb.id} onClick={() => { sfx.flip(); setNbId(nb.id); }}
              className={`slot-btn shrink-0 w-32 rounded-2xl rounded-r-md border-2 p-3 text-right relative ${active ? "border-[#8a4b7c] ring-2 ring-pink-200" : "border-white"}`}
              style={{ background: `linear-gradient(160deg, ${nb.coverColor}, #ffffff 130%)` }}>
              <span className="absolute top-0 bottom-0 right-2 w-[3px] bg-white/60 rounded" />
              <Icon name={nb.coverIcon} size={26} color="#8a4b7c" />
              <p className="font-display font-bold text-sm text-[#5b3a5e] mt-2 leading-tight line-clamp-2" dir="auto">{nb.title}</p>
              <p className="text-[11px] text-[#8a6d9e] mt-1">{nb.kind} · {count} صفحة</p>
              {active && (
                <span role="button" aria-label="حذف الدفتر" onClick={async (e) => { e.stopPropagation(); if (confirm("Supprimer ce cahier et toutes ses pages ?")) { await onDelete("notebooks", nb.id); setNbId(null); } }}
                  className="absolute top-1.5 left-1.5 bg-white/80 text-red-400 rounded-full p-1"><Trash2 size={13} /></span>
              )}
            </button>
          );
        })}
      </div>

      {activeNb && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <CuteButton className="bg-pink-400 text-white !py-1.5 text-xs" onClick={addPage}><FilePlus2 size={15} /> صفحة جديدة</CuteButton>
          <CuteButton className="bg-emerald-300 text-emerald-800 !py-1.5 text-xs" onClick={() => { sfx.flip(); printPages(activeNb.title, nbPages, module.name); }}><Printer size={15} /> تصدير الدفتر PDF</CuteButton>
          {draft && <CuteButton className="bg-sky-200 text-sky-800 !py-1.5 text-xs" onClick={() => printPages(draft.title, [draft], module.name)}><Printer size={15} /> PDF لهذه الصفحة</CuteButton>}
          <div className="ms-auto flex items-center gap-1 text-sm font-bold text-[#8a6d9e]">
            <button className="cute-btn bg-pink-50 p-1.5 text-pink-500" onClick={() => flipTo(pageIdx + 1)} aria-label="الصفحة السابقة"><ChevronRight size={17} /></button>
            <span dir="ltr">{nbPages.length ? pageIdx + 1 : 0} / {nbPages.length}</span>
            <button className="cute-btn bg-pink-50 p-1.5 text-pink-500" onClick={() => flipTo(pageIdx - 1)} aria-label="الصفحة التالية"><ChevronLeft size={17} /></button>
          </div>
        </div>
      )}

      {activeNb && !draft && <EmptyState icon="FilePlus2" text="هذا الدفتر فارغ" sub="اضغطي «صفحة جديدة» لبدء الكتابة" />}

      {draft && (
        <div className="grid lg:grid-cols-[210px,1fr] gap-4">
          {/* Toolbar */}
          <div className="cute-card p-3 space-y-4 h-fit order-2 lg:order-1">
            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5 flex items-center gap-1"><Type size={13} /> الخط · Police</p>
              <select className="field !text-xs" value={draft.font} onChange={(e) => upd({ font: e.target.value })}>
                {FONTS.map((f) => <option key={f.value} value={f.value}>{f.name}</option>)}
              </select>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-[#b49cc4]">الحجم</span>
                <input type="range" min={15} max={30} value={draft.fontSize} onChange={(e) => upd({ fontSize: Number(e.target.value) })} className="flex-1 accent-pink-400" />
                <span className="text-xs font-bold">{draft.fontSize}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5">ورق الدفتر · Papier</p>
              <select className="field !text-xs" value={draft.paper} onChange={(e) => upd({ paper: e.target.value })}>
                {PAPERS.map((p) => <option key={p.value} value={p.value}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5">أقلامي · Mes stylos gel</p>
              <div className="flex flex-wrap gap-1.5">
                {INKS.map((ink) => (
                  <button key={ink.value} title={ink.name} onClick={() => { sfx.pop(); upd({ ink: ink.value }); }}
                    className={`w-7 h-7 rounded-full border-[3px] ${draft.ink === ink.value ? "border-[#5b3a5e] scale-110" : "border-white"} shadow`} style={{ background: ink.value }} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5 flex items-center gap-1"><Sparkles size={13} /> ملصقاتي · Stickers</p>
              <div className="grid grid-cols-5 gap-1.5">
                {STICKERS.map((s) => (
                  <button key={s} onClick={() => addSticker(s)} className="bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-xl p-1.5 flex items-center justify-center transition hover:scale-110" title={s}>
                    <Icon name={s} size={18} color="#e06aa0" />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#b49cc4] mt-1">اسحبي الملصق فوق الصفحة لوضعه حيث تريدين، وانقري عليه لتكبيره أو حذفه.</p>
              {selectedSticker !== null && draft.stickers[selectedSticker] && (
                <div className="flex items-center gap-1 mt-2">
                  <button className="cute-btn bg-violet-100 text-violet-600 px-2 py-1 text-xs font-bold" onClick={() => upd({ stickers: draft.stickers.map((s, i) => i === selectedSticker ? { ...s, size: s.size + 6 } : s) })}>+</button>
                  <button className="cute-btn bg-violet-100 text-violet-600 px-2 py-1 text-xs font-bold" onClick={() => upd({ stickers: draft.stickers.map((s, i) => i === selectedSticker ? { ...s, size: Math.max(16, s.size - 6) } : s) })}>−</button>
                  <button className="cute-btn bg-red-100 text-red-500 px-2 py-1 text-xs font-bold" onClick={() => { upd({ stickers: draft.stickers.filter((_, i) => i !== selectedSticker) }); setSelectedSticker(null); }}><Eraser size={13} /> حذف</button>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5">إدراج سريع</p>
              <div className="flex flex-col gap-1.5">
                <button className="cute-btn bg-amber-50 text-amber-600 px-2 py-1.5 text-xs font-bold justify-start" onClick={() => insertText("• ")}><ListPlus size={14} /> نقطة قائمة</button>
                <button className="cute-btn bg-emerald-50 text-emerald-600 px-2 py-1.5 text-xs font-bold justify-start" onClick={() => insertText("☐ مهمة : ")}><CheckSquare size={14} /> مهمة للمراجعة</button>
                <button className="cute-btn bg-sky-50 text-sky-600 px-2 py-1.5 text-xs font-bold justify-start" onClick={() => insertText("Définition : ")}>Définition :</button>
                <button className="cute-btn bg-pink-50 text-pink-600 px-2 py-1.5 text-xs font-bold justify-start" onClick={() => insertText("Exemple : ")}>Exemple :</button>
              </div>
            </div>

            <VoiceRecorder pageId={draft.id} moduleId={module.id} voice={voice.filter((v) => v.pageId === draft.id)} onCreate={onCreate} onDelete={onDelete} addPoints={addPoints} />

            {/* مؤشر الأخطاء اللحظي */}
            {draft.content && draft.content.trim().length >= 3 && (
              <div className="rounded-2xl border-2 border-[#FFB3D1] bg-[#FFF0F6] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#FFB3D1] bg-white">
                      <Icon name="MessageCircleQuestion" size={16} color="#C2255C" />
                    </span>
                    <div>
                      <p className="font-[Baloo_2] text-[12px] font-extrabold leading-none text-[#C2255C]">
                        {liveErrors.length > 0 ? `${liveErrors.length} faute${liveErrors.length > 1 ? "s" : ""} détectée${liveErrors.length > 1 ? "s" : ""}` : "Aucune faute"}
                      </p>
                      <p className="text-[10px] font-bold text-[#B0799C]">
                        {liveErrors.length > 0 ? "Je les souligne en rouge dans ton texte" : "Ton texte est parfait"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { sfx.pop(); setShowLiveErrors((s) => !s); }}
                    className={`cute-btn px-2.5 py-1 text-[10px] font-bold rounded-full ${showLiveErrors ? "bg-[#C2255C] text-white" : "bg-white text-[#C2255C] border-[#FFB3D1]"}`}
                  >
                    {showLiveErrors ? "Masquer" : "Montrer"}
                  </button>
                </div>
                {showLiveErrors && liveErrors.length > 0 && (
                  <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-0.5">
                    {liveErrors.slice(0, 4).map((err, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg bg-white/80 px-2 py-1.5 text-[10.5px] font-bold">
                        <span className="rounded bg-[#FFE3EC] px-1.5 py-0.5 text-[#C2255C] line-through decoration-[#E87BA0]">{err.wrong}</span>
                        <span className="text-[#C48AEA]">→</span>
                        <span className="rounded bg-[#E8FBEF] px-1.5 py-0.5 text-[#1B7046]">{err.right}</span>
                      </div>
                    ))}
                    {liveErrors.length > 4 && (
                      <p className="text-center text-[10px] font-bold text-[#B0799C]">+{liveErrors.length - 4} autres corrections disponibles dans le Professeur virtuel ↓</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <FrenchTutor
              getText={() => draft.content || ""}
              onDetected={(corrections) => setLiveErrors(corrections)}
              onApply={(corrected) => {
                upd({ content: corrected });
                setLiveErrors([]);
                addPoints(3, "Correction appliquée par le professeur virtuel");
              }}
            />
          </div>

          {/* Paper */}
          <div className="order-1 lg:order-2">
            <div ref={paperRef} onPointerMove={onStickerMove} onPointerUp={() => (dragRef.current = null)}
              className={`anim-page relative rounded-2xl shadow-[0_18px_35px_-18px_rgba(150,90,140,.45)] border border-[#eee0d8] overflow-hidden paper-${draft.paper}`}>
              <div className="spiral absolute top-0 bottom-0 right-0 w-6 opacity-70 pointer-events-none" />
              <input value={draft.title} onChange={(e) => upd({ title: e.target.value })} dir="auto"
                lang="fr" spellCheck={true} autoCorrect="on" autoCapitalize="sentences"
                className="w-full bg-transparent border-b-2 border-dashed border-pink-200 px-6 pt-4 pb-2 font-display font-bold text-xl text-[#d14d7e] placeholder:text-pink-200"
                placeholder="Titre de la leçon…" />
              {recovered && (
                <div className="mx-6 mt-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700">
                  تمت استعادة كتابتك غير المحفوظة من آخر مرة. اضغطي «حفظ الصفحة» لتأكيدها.
                </div>
              )}
              {/* طبقة العرض مع التسطير الأحمر للكلمات الخاطئة */}
              <div className="relative">
                {/* النص المعروض بتسطير الأخطاء */}
                <div
                  className="pointer-events-none absolute inset-0 px-6 py-2 overflow-hidden whitespace-pre-wrap break-words pe-10"
                  style={{ fontFamily: `'${draft.font}', cursive, sans-serif`, fontSize: draft.fontSize, color: draft.ink, lineHeight: "32px" }}
                  aria-hidden="true"
                >
                  {(() => {
                    const text = draft.content || "";
                    if (!text || !showLiveErrors || liveErrors.length === 0) return text;

                    type Mark = { start: number; end: number; reason: string };
                    const marks: Mark[] = [];
                    let searchFrom = 0;
                    for (const error of liveErrors) {
                      const length = error.length || error.wrong.length;
                      let start = typeof error.start === "number" ? error.start : -1;
                      if (start < 0 || text.slice(start, start + length).toLocaleLowerCase("fr") !== error.wrong.toLocaleLowerCase("fr")) {
                        start = text.toLocaleLowerCase("fr").indexOf(error.wrong.toLocaleLowerCase("fr"), searchFrom);
                      }
                      if (start < 0 || length <= 0 || marks.some((m) => start < m.end && start + length > m.start)) continue;
                      marks.push({ start, end: start + length, reason: error.reason });
                      searchFrom = start + length;
                    }
                    marks.sort((a, b) => a.start - b.start);

                    const nodes: React.ReactNode[] = [];
                    let cursor = 0;
                    marks.forEach((mark, index) => {
                      if (mark.start > cursor) nodes.push(<span key={`plain-${index}`}>{text.slice(cursor, mark.start)}</span>);
                      nodes.push(
                        <span
                          key={`error-${index}`}
                          className="rounded-sm bg-red-100/45 underline decoration-wavy decoration-[1.5px] decoration-red-500 underline-offset-[3px]"
                          title={mark.reason}
                        >
                          {text.slice(mark.start, mark.end)}
                        </span>
                      );
                      cursor = mark.end;
                    });
                    if (cursor < text.length) nodes.push(<span key="plain-last">{text.slice(cursor)}</span>);
                    return nodes;
                  })()}
                </div>
                {/* طبقة الإدخال الشفافة فوق النص */}
                <textarea
                  value={draft.content}
                  onChange={(e) => { upd({ content: e.target.value }); analyzeText(e.target.value); }}
                  dir="auto"
                  className="relative w-full bg-transparent resize-y min-h-[420px] px-6 py-2 pe-10 text-transparent caret-[#3b4a6b] selection:bg-pink-200 selection:text-transparent"
                  style={{ fontFamily: `'${draft.font}', cursive, sans-serif`, fontSize: draft.fontSize, lineHeight: "32px" }}
                  placeholder="Commence à écrire ton résumé ici, comme dans ton cahier préféré…"
                />
              </div>
              {draft.stickers.map((s, i) => (
                <span key={i}
                  onPointerDown={(e) => { dragRef.current = { idx: i }; setSelectedSticker(i); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
                  className={`absolute cursor-grab active:cursor-grabbing select-none rounded-full bg-white/75 p-1 shadow ${selectedSticker === i ? "ring-2 ring-pink-400" : ""}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%,-50%) rotate(${s.rot}deg)`, touchAction: "none" }}>
                  <Icon name={s.icon} size={s.size} color={s.color} />
                </span>
              ))}
              {/* voice hearts floating on the page */}
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {voice.filter((v) => v.pageId === draft.id).map((v) => <VoiceHeart key={v.id} v={v} />)}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <CuteButton className={`${dirty ? "bg-pink-500" : "bg-pink-300"} text-white`} onClick={save}><Save size={16} /> {dirty ? "حفظ الصفحة · Enregistrer" : "محفوظة"}</CuteButton>
              <SummaryFinishButton key={draft.id} pageId={draft.id} content={draft.content || ""} save={save} />
              <CuteButton className="bg-red-50 text-red-400" onClick={async () => { if (confirm("Supprimer cette page ?")) { await onDelete("pages", draft.id); setPageIdx(0); } }}><Trash2 size={16} /> حذف الصفحة</CuteButton>
              <span className="text-xs font-bold inline-flex items-center gap-1.5" aria-live="polite">
                {saveStatus === "saving" && <span className="text-sky-500">جارٍ الحفظ التلقائي…</span>}
                {saveStatus === "saved" && !dirty && <span className="text-emerald-500">✓ محفوظة تلقائياً</span>}
                {saveStatus === "pending" && dirty && <span className="text-[#b49cc4]">سيُحفظ تلقائياً بعد توقف الكتابة</span>}
                {saveStatus === "error" && <span className="text-rose-500">تعذّر الحفظ — يعيد المحاولة، والنص محفوظ محلياً</span>}
              </span>
            </div>

            {/* page thumbnails */}
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {nbPages.map((p, i) => (
                <button key={p.id} onClick={() => flipTo(i)} className={`cute-btn px-2.5 py-1 text-[11px] font-bold max-w-[140px] truncate ${i === pageIdx ? "bg-[#8a4b7c] text-white" : "bg-white text-[#8a6d9e] border-pink-100"}`} dir="auto">
                  {i + 1}. {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNewNb && (
        <Modal title="دفتر جديد · Nouveau cahier" onClose={() => setShowNewNb(false)}>
          <div className="space-y-3">
            <input className="field" placeholder="Titre du cahier — عنوان الدفتر" value={nbForm.title} onChange={(e) => setNbForm({ ...nbForm, title: e.target.value })} dir="auto" />
            <select className="field" value={nbForm.kind} onChange={(e) => setNbForm({ ...nbForm, kind: e.target.value })}>
              {["Cours", "Résumés", "Exercices", "Glossaire", "Autre"].map((k) => <option key={k}>{k}</option>)}
            </select>
            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5">لون الغلاف</p>
              <div className="flex flex-wrap gap-1.5">{[...new Set([...NOTEBOOK_COVERS, ...PASTELS])].map((c) => (
                <button key={c} onClick={() => setNbForm({ ...nbForm, coverColor: c })} className={`w-8 h-8 rounded-full border-[3px] ${nbForm.coverColor === c ? "border-[#5b3a5e] scale-110" : "border-white"} shadow`} style={{ background: c }} />
              ))}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-[#8a6d9e] mb-1.5">ملصق الغلاف</p>
              <div className="flex flex-wrap gap-1.5">{["NotebookPen", "BookOpen", "Sparkles", "Heart", "Flower2", "Cat", "Rabbit", "Star", "Feather", "GraduationCap"].map((ic) => (
                <button key={ic} onClick={() => setNbForm({ ...nbForm, coverIcon: ic })} className={`p-2 rounded-xl border-2 ${nbForm.coverIcon === ic ? "border-pink-400 bg-pink-50" : "border-pink-100 bg-white"}`}><Icon name={ic} size={19} color="#e06aa0" /></button>
              ))}</div>
            </div>
            <CuteButton className="bg-pink-500 text-white w-full justify-center" onClick={addNotebook}><Plus size={16} /> إنشاء الدفتر</CuteButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

function VoiceHeart({ v }: { v: VoiceT }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toggle = () => {
    if (!audioRef.current) { audioRef.current = new Audio(v.dataUrl); audioRef.current.onended = () => setPlaying(false); }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { void audioRef.current.play(); setPlaying(true); }
  };
  return (
    <button onClick={toggle} title={v.title} className="relative text-pink-500 hover:scale-125 transition">
      <Heart size={34} fill="#ffd6e8" />
      <span className="absolute inset-0 flex items-center justify-center text-pink-600">{playing ? <Pause size={13} /> : <Play size={13} />}</span>
    </button>
  );
}

function VoiceRecorder({ pageId, moduleId, voice, onCreate, onDelete, addPoints }: {
  pageId: number; moduleId: number; voice: VoiceT[];
  onCreate: Create; onDelete: Remove; addPoints: (n: number, r: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          await onCreate("voice", { moduleId, pageId, title: `Note vocale — ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, dataUrl: String(reader.result), duration: secs });
          sfx.chime(); addPoints(5, "Note vocale ajoutée");
        };
        reader.readAsDataURL(blob);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true); setSecs(0);
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } catch { setError("Autorise le microphone pour enregistrer."); }
  };

  const stop = () => {
    recRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div>
      <p className="text-xs font-bold text-[#8a6d9e] mb-1.5 flex items-center gap-1"><Mic size={13} /> ملاحظات صوتية · Notes vocales</p>
      <button onClick={() => (recording ? stop() : void start())}
        className={`cute-btn w-full justify-center px-3 py-2 text-xs font-bold flex items-center gap-2 ${recording ? "bg-red-400 text-white animate-pulse" : "bg-pink-100 text-pink-600"}`}>
        {recording ? <><Square size={14} /> إيقاف التسجيل… {secs}ث</> : <><Heart size={15} fill="currentColor" /> سجّلي بصوتك</>}
      </button>
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
      <div className="mt-2 space-y-1.5">
        {voice.map((v) => (
          <div key={v.id} className="flex items-center gap-2 bg-pink-50/70 border border-pink-100 rounded-2xl px-2 py-1.5">
            <VoiceHeart v={v} />
            <span className="text-[11px] font-bold text-[#8a6d9e] flex-1 truncate" dir="auto">{v.title}</span>
            <button className="text-red-300 hover:text-red-500" onClick={() => void onDelete("voice", v.id)} aria-label="Supprimer"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
