"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flower2, BookOpen, Backpack, MessageCircleQuestion, Pencil, Trash2, Quote,
  Star, Volume2, VolumeX, ArrowRight, GraduationCap, Layers, Sparkles,
} from "lucide-react";
import Timetable from "@/components/Timetable";
import AchievementTree from "@/components/AchievementTree";
import ModuleModal from "@/components/ModuleModal";
import Pomodoro from "@/components/pomodoro";
import StudyPet from "@/components/StudyPet";
import WordOfDay from "@/components/WordOfDay";
import MoodCorner from "@/components/MoodCorner";
import BadgesPanel from "@/components/BadgesPanel";
import { StudyCorners } from "@/components/study-ui";
import { DynIcon } from "@/components/Icon";
import { apiDelete, apiList, type Module, type Slot, type Notebook, type Doubt } from "@/lib/api";
import { ProgressProvider, useProgress } from "@/lib/ProgressContext";
import { DAYS, getColor, quoteOfTheDay, todayIdx, dateStrFr } from "@/lib/constants";
import { sfx, setMuted } from "@/lib/sound";

export default function Page() {
  return (
    <ProgressProvider>
      <Home />
    </ProgressProvider>
  );
}

function Home() {
  const { ready, points, completePomodoro } = useProgress();
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleModal, setModuleModal] = useState<{ open: boolean; initial: Module | null }>({ open: false, initial: null });
  const [muted, setMutedState] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, sl, d, nbs] = await Promise.all([
        apiList<Module>("modules"),
        apiList<Slot>("timetable"),
        apiList<Doubt>("doubts"),
        apiList<Notebook>("notebooks"),
      ]);
      setModules(m);
      setSlots(sl);
      setDoubts(d);
      setNotebooks(nbs);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (ready) void load(); }, [ready, load]);

  /* doux son de clic sur chaque bouton, comme les vieux jeux flash */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest("button,a");
      if (el) sfx.pop();
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const quote = quoteOfTheDay();
  const today = todayIdx();
  const dateFr = dateStrFr();
  const todaySlots = useMemo(
    () => slots.filter((s) => Number(s.day) === today).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slots, today]
  );
  const moduleById = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const unresolved = doubts.filter((d) => !d.resolved).length;

  const deleteModule = async (m: Module) => {
    if (!window.confirm(`Supprimer « ${m.name} » et tout son contenu (cahiers, cartes, quiz…) ?`)) return;
    await apiDelete("modules", m.id);
    sfx.flip();
    window.dispatchEvent(new Event("cahier:modules"));
    void load();
  };

  const openModule = (id: number) => { sfx.flip(); router.push(`/module/${id}`); };

  const toggleSound = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    try { window.localStorage.setItem("petit-cahier-muted", next ? "1" : "0"); } catch {}
    if (!next) sfx.pop();
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("petit-cahier-muted") === "1";
      if (stored) { setMutedState(true); setMuted(true); }
    } catch {}
  }, []);

  const stats = [
    { label: "Matière suivie", value: modules.length, color: "rose", icon: BookOpen },
    { label: "Séances / semaine", value: slots.length, color: "lavande", icon: Layers },
    { label: "Points à clarifier", value: unresolved, color: "ciel", icon: MessageCircleQuestion },
    { label: "Étoiles gagnées", value: points, color: "menthe", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#FFF7FB] text-[#5B4A6F]">
      {/* ─── Barre supérieure ─── */}
      <header className="sticky top-0 z-40 border-b-2 border-[#F3E3EF] bg-[#FFF7FB]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="anim-wiggle flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#FFB3D1] bg-[#FFF0F6] shadow-md">
              <Flower2 size={22} color="#C2255C" />
            </span>
            <span className="font-[Baloo_2] text-[15px] font-extrabold leading-none text-[#8A4B7C]">
              mon petit cahier
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border-2 border-[#F6DCE9] bg-white/80 p-1 md:flex">
            <Link href="/" className="btn-cute flex items-center gap-1.5 rounded-full bg-[#C2255C] px-4 py-1.5 text-xs font-bold text-white">
              <BookOpen size={14} /> accueil
            </Link>
            <Link href="/stage" className="btn-cute flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#8A7BA6] hover:bg-[#FFF0F6]">
              <Backpack size={14} /> stage
            </Link>
            <Link href="/doutes" className="btn-cute relative flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#8A7BA6] hover:bg-[#EFF8FF]">
              <MessageCircleQuestion size={14} /> doutes
              {unresolved > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F06595] text-[9px] font-bold text-white">{unresolved}</span>
              )}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full border-2 border-[#FFF3B0] bg-[#FFFBE6] px-3 py-1 text-xs font-extrabold text-[#8A6A12]" dir="ltr">
              <Star size={14} fill="#F6B93B" className="text-amber-500" /> {points}
            </span>
            <button
              onClick={toggleSound}
              className="btn-cute flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#F6DCE9] bg-white text-[#8A7BA6]"
              aria-label={muted ? "Activer les sons" : "Couper les sons"}
              title={muted ? "Activer les sons" : "Couper les sons"}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          <Link href="/" className="btn-cute bg-[#C2255C] px-3 py-1 text-[11px] font-bold text-white">accueil</Link>
          <Link href="/stage" className="btn-cute bg-white px-3 py-1 text-[11px] font-bold text-[#8A7BA6]">stage</Link>
          <Link href="/doutes" className="btn-cute bg-white px-3 py-1 text-[11px] font-bold text-[#8A7BA6]">doutes</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-4">
        {/* ─── Coin motivation ─── */}
        <section
          className="anim-fade-up relative overflow-hidden rounded-[1.8rem] border-2 border-[#FFD6E8] p-5 shadow-[0_14px_36px_-14px_rgba(230,140,190,.5)]"
          style={{ background: "linear-gradient(120deg,#FFF0F6 0%, #F4F0FF 55%, #EDFBF3 100%)" }}
        >
          <Sparkles className="absolute right-6 top-4 text-[#EFC94C] opacity-50" size={26} style={{ animation: "twinkle 2.4s ease-in-out infinite" }} />
          <Sparkles className="absolute bottom-4 right-16 text-[#B79CED] opacity-50" size={18} style={{ animation: "twinkle 3s ease-in-out infinite .6s" }} />
          <div className="relative">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border-2 border-[#FFB3D1] bg-white/80 px-3 py-0.5 text-[11px] font-extrabold capitalize text-[#C2255C]">
                {dateFr}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#D8C7E8]">
                <Quote size={11} /> coin de motivation
              </span>
            </div>
            <h1 className="font-[Baloo_2] text-2xl font-extrabold text-[#5B4A6F] sm:text-[28px]">
              Bonjour, future professeure de français !
            </h1>
            <p className="font-[Caveat] text-[23px] font-semibold leading-snug text-[#B08CCB] sm:text-[26px]">
              « {quote.text} »
            </p>
            <p className="text-[11px] font-bold text-[#D8C7E8]">— {quote.author}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-[#8A7BA6]">aujourd'hui :</span>
              {todaySlots.length === 0 && (
                <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold text-[#1B7046]">
                  journée libre — parfaite pour réviser en douceur !
                </span>
              )}
              {todaySlots.map((s) => {
                const m = moduleById.get(s.moduleId);
                if (!m) return null;
                const c = getColor(m.color);
                return (
                  <button
                    key={s.id}
                    onClick={() => openModule(m.id)}
                    className="btn-cute flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-extrabold"
                    style={{ background: c.bg, borderColor: c.border, color: c.text }}
                  >
                    <DynIcon name={m.icon} size={12} color={c.text} />
                    <span dir="ltr">{s.startTime}</span> · {m.name} ({s.kind})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <WordOfDay />

        {/* ─── Bandeau statistiques ─── */}
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map(({ label, value, color, icon: Ic }) => {
            const c = getColor(color);
            return (
              <div key={label} className="flex items-center gap-2.5 rounded-2xl border-2 bg-white/85 px-3 py-2.5 shadow-sm" style={{ borderColor: c.border }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2" style={{ background: c.bg, borderColor: c.border }}>
                  <Ic size={16} color={c.text} />
                </span>
                <div className="min-w-0">
                  <p className="font-[Baloo_2] text-xl font-extrabold leading-none text-[#5B4A6F]" dir="ltr">{value}</p>
                  <p className="truncate text-[10.5px] font-bold text-[#B79CED]">{label}</p>
                </div>
              </div>
            );
          })}
        </section>

        <StudyCorners />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            {/* ─── Emploi du temps ─── */}
            <div className="card-cute relative overflow-hidden p-4 sm:p-5">
              <div className="washi absolute -top-2 left-24 h-5 w-24 rotate-[-10deg] rounded-sm bg-[#FFF3B0]/80" />
              {loading ? (
                <div className="flex h-56 items-center justify-center">
                  <p className="anim-bob font-[Baloo_2] text-lg font-bold text-[#B79CED]">Je prépare ton joli cahier…</p>
                </div>
              ) : (
                <Timetable modules={modules} slots={slots} onChanged={load} onOpenModule={openModule} />
              )}
            </div>

            {/* ─── Mes matières ─── */}
            <section className="card-cute p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-[#CDB4F6] bg-[#F4F0FF]">
                    <BookOpen size={19} color="#6741A8" />
                  </span>
                  <div>
                    <h2 className="font-[Baloo_2] text-xl font-extrabold leading-none text-[#5B4A6F]">Mes matières</h2>
                    <p className="mt-1 text-[11px] font-semibold text-[#B79CED]">
                      Chaque matière a ses cahiers, ses cartes, ses quiz et ses résultats
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModuleModal({ open: true, initial: null })}
                  className="btn-cute flex items-center gap-1.5 rounded-full px-4 py-2 font-[Baloo_2] text-sm font-bold text-white shadow-md"
                  style={{ background: "linear-gradient(135deg,#FF8FB8,#B79CED)" }}
                >
                  + Nouvelle matière
                </button>
              </div>

              {modules.length === 0 && !loading && (
                <div className="rounded-3xl border-2 border-dashed border-[#F0DCEC] bg-[#FFFBFE] p-8 text-center">
                  <GraduationCap size={38} className="mx-auto text-[#E3C6DE]" />
                  <p className="mt-2 font-[Baloo_2] text-lg font-bold text-[#8A7BA6]">Aucune matière pour le moment</p>
                  <p className="text-sm font-semibold text-[#C4A8D4]">Clique sur « Nouvelle matière » pour commencer ton organisation !</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {modules.map((m) => {
                  const c = getColor(m.color);
                  const sessions = slots.filter((s) => s.moduleId === m.id).length;
                  return (
                    <div
                      key={m.id}
                      className="group relative overflow-hidden rounded-[1.4rem] border-2 p-4 shadow-sm transition-transform hover:-translate-y-1"
                      style={{ background: c.soft, borderColor: c.border }}
                    >
                      <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full opacity-40" style={{ background: c.bg }} />
                      <div className="relative">
                        <div className="flex items-start justify-between">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 bg-white/90 shadow-sm" style={{ borderColor: c.border }}>
                            <DynIcon name={m.icon} size={23} color={c.text} />
                          </span>
                          <span className="hidden gap-1 group-hover:flex">
                            <button onClick={() => setModuleModal({ open: true, initial: m })} className="btn-cute rounded-full bg-white/90 p-1.5 text-[#8A7BA6] shadow" title="Modifier">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteModule(m)} className="btn-cute rounded-full bg-white/90 p-1.5 text-[#E03131] shadow" title="Supprimer">
                              <Trash2 size={13} />
                            </button>
                          </span>
                        </div>
                        <h3 className="mt-3 font-[Baloo_2] text-[17px] font-extrabold leading-tight" style={{ color: c.text }} dir="auto">
                          {m.name}
                        </h3>
                        <p className="text-[11px] font-bold text-[#8A7BA6]">{m.teacher || "—"}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[#8A7BA6]">Coef. {m.coefficient}</span>
                          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[#8A7BA6]">{sessions} séance{sessions > 1 ? "s" : ""}/sem.</span>
                        </div>
                        <button
                          onClick={() => openModule(m.id)}
                          className="btn-cute mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-2 font-[Baloo_2] text-sm font-bold text-white shadow"
                          style={{ background: c.solid }}
                        >
                          Ouvrir le cahier <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ─── Colonne latérale ─── */}
          <div className="space-y-5">
            <Pomodoro onComplete={() => completePomodoro()} />
            <AchievementTree />
            <BadgesPanel compact />
            <MoodCorner />

            {/* Mes cahiers */}
            <section className="card-cute p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-[Baloo_2] text-base font-extrabold text-[#5B4A6F]">
                  <BookOpen size={15} color="#C2255C" /> Mes cahiers
                </h3>
                <span className="rounded-full bg-[#FFF0F6] px-2 py-0.5 text-[10px] font-extrabold text-[#C2255C]">{notebooks.length}</span>
              </div>
              {notebooks.length === 0 ? (
                <p className="rounded-xl border-2 border-dashed border-[#F3E3EF] px-2 py-3 text-center text-[11px] font-bold text-[#C4A8D4]">
                  Ouvre une matière pour créer ton premier cahier.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {[...notebooks].reverse().slice(0, 6).map((nb) => {
                    const nc = getColor(nb.coverColor);
                    const owner = modules.find((m) => m.id === nb.moduleId);
                    return (
                      <button
                        key={nb.id}
                        onClick={() => owner && openModule(owner.id)}
                        className="flex w-full items-center gap-2 rounded-xl border-2 px-2 py-1.5 text-left transition hover:-translate-y-0.5"
                        style={{ borderColor: nc.border, background: nc.soft }}
                      >
                        <span className="h-7 w-1.5 shrink-0 rounded-full" style={{ background: nc.solid }} />
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 bg-white/80" style={{ borderColor: nc.border }}>
                          <DynIcon name={nb.coverIcon} size={13} color={nc.text} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11.5px] font-extrabold text-[#5B4A6F]" dir="auto">{nb.title}</span>
                          <span className="block truncate text-[9.5px] font-bold" style={{ color: nc.text }}>{owner?.name || nb.kind} · {nb.kind}</span>
                        </span>
                        <ArrowRight size={13} className="shrink-0 text-[#C4A8D4]" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <Link href="/stage" className="btn-cute card-cute block p-4" style={{ borderColor: "#FFC79A", background: "linear-gradient(150deg,#FFF6EC,#FFF)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#FFC79A] bg-[#FFE3C8]">
                  <Backpack size={23} color="#95531A" />
                </span>
                <div>
                  <h3 className="font-[Baloo_2] text-base font-extrabold leading-tight text-[#7A4A12]">Stage et pédagogie</h3>
                  <p className="text-[11px] font-semibold text-[#C79A66]">Observation, pédagogie et journal du stage</p>
                </div>
              </div>
            </Link>

            <Link href="/doutes" className="btn-cute card-cute block p-4" style={{ borderColor: "#9FD8F5", background: "linear-gradient(150deg,#EFF8FF,#FFF)" }}>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#9FD8F5] bg-[#CDEBFF]">
                  <MessageCircleQuestion size={23} color="#17628F" />
                </span>
                <div>
                  <h3 className="font-[Baloo_2] text-base font-extrabold leading-tight text-[#14507A]">Zone des doutes</h3>
                  <p className="text-[11px] font-semibold text-[#6FA8CC]">
                    {unresolved > 0 ? `${unresolved} point${unresolved > 1 ? "s" : ""} à clarifier — on y retourne ?` : "Rien en attente, tout est clair !"}
                  </p>
                </div>
              </div>
            </Link>

            <section className="card-cute p-4" style={{ borderColor: "#E4B8F5", background: "linear-gradient(150deg,#FBF2FF,#FFF)" }}>
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#E4B8F5] bg-[#F3D9FF]">
                  <Layers size={23} color="#6E2F88" />
                </span>
                <div>
                  <h3 className="font-[Baloo_2] text-base font-extrabold leading-tight text-[#6E2F88]">Le savais-tu ?</h3>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#9A6BB0]">
                    Dans chaque matière, tu trouveras des <b>cartes flash</b> pour tester ta mémoire, des <b>quiz</b> à créer toi-même,
                    et tes <b>résultats</b> avec le calcul automatique de la moyenne. Clique sur une matière pour explorer !
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {moduleModal.open && (
        <ModuleModal
          initial={moduleModal.initial}
          onClose={() => setModuleModal({ open: false, initial: null })}
          onSaved={() => { window.dispatchEvent(new Event("cahier:modules")); void load(); }}
        />
      )}
      <StudyPet />
    </div>
  );
}
