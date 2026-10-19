"use client";
import { useMemo, useState } from "react";
import { Plus, Clock, Pencil, Trash2, X, Check, Coffee } from "lucide-react";
import type { Module, Slot } from "@/lib/api";
import { DAYS, getColor } from "@/lib/constants";
import { sounds } from "@/lib/sounds";
import { DynIcon } from "@/components/Icon";

type TimetableProps = {
  modules: Module[];
  slots: Slot[];
  onChanged: () => void;
  onOpenModule?: (id: number) => void;
};

const START_HOUR = 8;
const END_HOUR = 19;
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

const KINDS = ["Cours", "TD", "TP", "Examen"];

export default function Timetable({ modules, slots, onChanged, onOpenModule }: TimetableProps) {
  const [form, setForm] = useState<null | { id?: number; moduleId: number; day: number; start: string; end: string; room: string; kind: string }>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const moduleById = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const byDay = useMemo(() => {
    const map = new Map<number, Slot[]>();
    DAYS.forEach((d) => map.set(d.key, []));
    slots.forEach((s) => {
      const arr = map.get(Number(s.day));
      if (arr) arr.push(s);
    });
    return map;
  }, [slots]);

  const openNew = (day: number, hour: number) => {
    sounds.pop();
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(Math.min(hour + 1, END_HOUR)).padStart(2, "0")}:00`;
    setForm({ moduleId: modules[0]?.id ?? 0, day, start, end, room: "", kind: "Cours" });
  };

  const openEdit = (s: Slot) => {
    sounds.pop();
    setForm({ id: s.id, moduleId: s.moduleId, day: Number(s.day), start: s.startTime, end: s.endTime, room: s.room || "", kind: s.kind || "Cours" });
  };

  const save = async () => {
    if (!form || saving) return;
    if (toMinutes(form.end) <= toMinutes(form.start)) {
      window.alert("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSaving(true);
    const body = {
      moduleId: form.moduleId,
      day: form.day,
      startTime: form.start,
      endTime: form.end,
      room: form.room,
      kind: form.kind,
    };
    const url = form.id ? `/api/timetable/${form.id}` : "/api/timetable";
    await fetch(url, {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    sounds.chime();
    setSaving(false);
    setForm(null);
    onChanged();
  };

  const remove = async () => {
    if (!form?.id) return;
    if (!window.confirm("Supprimer cette séance de l'emploi du temps ?")) return;
    await fetch(`/api/timetable/${form.id}`, { method: "DELETE" });
    sounds.pop();
    setForm(null);
    onChanged();
  };

  return (
    <section className="relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[Baloo_2] text-xl font-bold text-[#5B4A6F] flex items-center gap-2">
          <Clock size={18} color="#D6336C" /> Mon emploi du temps
        </h2>
        <div className="flex items-center gap-2">
          <p className="hidden sm:block text-[11px] font-bold text-[#B79CED]">
            Clique sur une matière pour ouvrir son cahier • clique sur une case libre pour ajouter une séance
          </p>
          <button
            onClick={() => modules.length && openNew(1, 8)}
            disabled={!modules.length}
            className="btn-cute flex items-center gap-1 rounded-full bg-gradient-to-l from-[#FF8FB8] to-[#B79CED] px-3 py-1.5 text-xs font-[Baloo_2] font-bold text-white shadow disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={3} /> Séance
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-[#F3D9FF] bg-white/90 shadow-sm">
        <div className="min-w-[900px]">
          {/* Hours header */}
          <div className="flex border-b-2 border-[#F3D9FF] bg-[#FFF7FB]">
            <div className="w-[104px] shrink-0 border-r-2 border-[#F3D9FF] px-2 py-2 text-center text-[10px] font-extrabold text-[#B79CED]">
              Jour / Heure
            </div>
            <div className="flex flex-1">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 border-r border-[#F3D9FF] px-1 py-2 text-center text-[10px] font-extrabold text-[#D6336C] last:border-r-0" dir="ltr">
                  {String(h).padStart(2, "0")}:00
                  <span className="block text-[9px] font-bold text-[#C4A8D4]">
                    {String(h + 1).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          {DAYS.map((d) => {
            const daySlots = byDay.get(d.key) ?? [];
            return (
              <div key={d.key} className="flex border-b border-[#F3E3EF] last:border-b-0 hover:bg-[#FFF0F6]/40 transition">
                <div className="w-[104px] shrink-0 border-r-2 border-[#F3D9FF] bg-[#FFF7FB]/80 px-2 py-3">
                  <p className="font-[Baloo_2] text-[12px] font-extrabold text-[#8A4B7C]">{d.label}</p>
                  <p className="text-[9px] font-bold text-[#C4A8D4]">{daySlots.length} séance{daySlots.length > 1 ? "s" : ""}</p>
                </div>
                <div className="relative flex-1" style={{ minHeight: 62 }}>
                  {/* hour background cells */}
                  <div className="absolute inset-0 flex">
                    {HOURS.map((h) => (
                      <button
                        key={h}
                        onClick={() => modules.length && openNew(d.key, h)}
                        className="group flex-1 border-r border-[#F7ECF3] last:border-r-0 flex items-center justify-center"
                        aria-label={`Ajouter une séance ${d.label} ${h}:00`}
                      >
                        <Plus size={13} className="text-[#E8CFE8] opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ))}
                  </div>

                  {/* slot blocks */}
                  <div className="absolute inset-0 pointer-events-none">
                    {daySlots.map((s) => {
                      const m = moduleById.get(s.moduleId);
                      if (!m) return null;
                      const start = Math.max(toMinutes(s.startTime), START_HOUR * 60);
                      const end = Math.min(toMinutes(s.endTime), END_HOUR * 60);
                      if (end <= start) return null;
                      const left = ((start - START_HOUR * 60) / TOTAL_MIN) * 100;
                      const width = ((end - start) / TOTAL_MIN) * 100;
                      const c = getColor(m.color);
                      const active = hovered === s.id;
                      return (
                        <div
                          key={s.id}
                          className="absolute top-1.5 bottom-1.5 px-0.5 pointer-events-auto"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          onMouseEnter={() => setHovered(s.id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <button
                            onClick={() => { sounds.flip(); onOpenModule?.(m.id); }}
                            className="slot-btn group h-full w-full rounded-xl border-2 px-1.5 py-1 text-right overflow-hidden relative"
                            style={{ background: `linear-gradient(140deg, ${c.solid}, ${c.bg})`, borderColor: c.border }}
                            title={`${m.name} · ${s.startTime}–${s.endTime}`}
                          >
                            <span className="flex items-center gap-1">
                              <DynIcon name={m.icon} size={12} color="#fff" />
                              <span className="truncate text-[10.5px] font-extrabold leading-tight" style={{ color: c.text }} dir="auto">
                                {m.name}
                              </span>
                            </span>
                            <span className="flex items-center justify-between gap-1 text-[9px] font-bold leading-tight" style={{ color: c.text }} dir="ltr">
                              <span>{s.startTime}–{s.endTime}</span>
                              {s.room ? <span className="truncate opacity-80">{s.room}</span> : null}
                            </span>
                            <span className="absolute top-0.5 left-0.5 rounded-full bg-white/80 px-1 text-[8px] font-extrabold" style={{ color: c.text }}>
                              {s.kind}
                            </span>
                            {active && (
                              <span
                                role="button"
                                aria-label="Modifier la séance"
                                onClick={(e) => { e.stopPropagation(); openEdit(s); }}
                                className="absolute bottom-0.5 right-0.5 rounded-full bg-white/95 p-1 shadow"
                              >
                                <Pencil size={10} color="#8a6d9e" />
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-bold text-[#8A7BA6]">
        <span dir="ltr">Lundi → Samedi · 08:00 → 19:00</span>
        <span className="flex items-center gap-1">
          <Coffee size={12} /> Une séance peut durer plusieurs heures : clique dessus puis choisis ses horaires (ex. 08:00 → 12:00)
        </span>
      </div>

      {/* add / edit modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#5b3a5e]/40 p-3 backdrop-blur-sm" onClick={() => setForm(null)}>
          <div className="cute-card w-full max-w-md p-5 relative" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-[Baloo_2] text-lg font-bold text-[#8A4B7C]">
                {form.id ? "Modifier la séance" : "Nouvelle séance"}
              </h3>
              <button onClick={() => setForm(null)} className="rounded-full bg-pink-100 p-1.5 text-pink-500" aria-label="Fermer"><X size={16} /></button>
            </div>
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold text-[#8A7BA6]">Matière
                <select className="field mt-1" value={form.moduleId} onChange={(e) => setForm({ ...form, moduleId: Number(e.target.value) })}>
                  {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-[#8A7BA6]">Jour
                  <select className="field mt-1" value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}>
                    {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-[#8A7BA6]">Type
                  <select className="field mt-1" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                    {KINDS.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] font-bold text-[#8A7BA6]">Début
                  <input type="time" min="08:00" max="19:00" className="field mt-1" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
                </label>
                <label className="text-[11px] font-bold text-[#8A7BA6]">Fin
                  <input type="time" min="08:00" max="19:00" className="field mt-1" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
                </label>
              </div>
              <label className="block text-[11px] font-bold text-[#8A7BA6]">Salle (optionnel)
                <input className="field mt-1" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Amphi A, Salle 12…" />
              </label>
              <p className="rounded-xl bg-[#FFF0F6] px-3 py-2 text-[10.5px] font-bold text-[#B0799C]">
                Astuce : choisis une fin plus tardive pour allonger la séance (ex. 08:00 → 12:00 pour 4 heures de cours).
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving} className="btn-cute flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#D6336C] py-2 font-[Baloo_2] text-sm font-bold text-white disabled:opacity-60">
                  <Check size={15} /> Enregistrer dans le tableau
                </button>
                {form.id && (
                  <button onClick={remove} className="btn-cute flex items-center justify-center gap-1.5 rounded-full bg-red-50 px-3 py-2 font-[Baloo_2] text-sm font-bold text-red-500">
                    <Trash2 size={15} /> Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
