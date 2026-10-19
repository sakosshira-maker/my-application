"use client";
import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiCreate, apiUpdate, apiDelete } from "@/lib/api";
import { sounds } from "@/lib/sounds";
import { PASTELS } from "@/lib/app";
import { NOTEBOOK_COVERS } from "@/lib/constants";
import { CuteButton, Icon, Modal } from "@/components/ui";

type ModuleModalProps = {
  initial: { id: number; name: string; short: string; color: string; icon: string; teacher: string; coefficient: number; credits: number; description: string } | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ModuleModal({ initial, onClose, onSaved }: ModuleModalProps) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    short: initial?.short ?? "",
    teacher: initial?.teacher ?? "",
    color: initial?.color ?? PASTELS[0],
    icon: initial?.icon ?? "BookOpen",
    coefficient: initial?.coefficient ?? 1,
    credits: initial?.credits ?? 3,
    description: initial?.description ?? "",
  });

  const save = async () => {
    if (!f.name.trim()) return;
    const body = {
      name: f.name, short: f.short, teacher: f.teacher, color: f.color, icon: f.icon,
      coefficient: f.coefficient, credits: f.credits, description: f.description,
    };
    if (initial) {
      await apiUpdate("modules", initial.id, body as any);
    } else {
      const created = await apiCreate<any>("modules", body as any);
      const cover = NOTEBOOK_COVERS[Math.floor(Math.random() * NOTEBOOK_COVERS.length)];
      await apiCreate("notebooks", {
        moduleId: created.id,
        title: `Cahier de ${f.name}`,
        coverColor: f.color || cover,
        coverIcon: "NotebookPen",
        kind: "Cours",
      });
    }
    sounds.chime();
    onClose();
    onSaved();
  };

  const remove = async () => {
    if (!initial) return;
    if (!window.confirm(`Supprimer « ${initial.name} » et tout son contenu ?`)) return;
    await apiDelete("modules", initial.id);
    sounds.pop();
    onClose();
    onSaved();
  };

  return (
    <Modal title={initial ? "Modifier la matière" : "Nouvelle matière"} onClose={onClose}>
      <div className="space-y-3">
        <input className="field" placeholder="Nom de la matière" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} dir="auto" />
        <input className="field" placeholder="Abréviation (GRAM, LITT…)" value={f.short} onChange={(e) => setF({ ...f, short: e.target.value })} dir="auto" />
        <input className="field" placeholder="Enseignant(e)" value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })} dir="auto" />
        <textarea className="field" rows={2} placeholder="Description courte…" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} dir="auto" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-[#8A6d9e] block">Coefficient</label>
            <input className="field mt-1 w-full" type="number" value={f.coefficient} onChange={(e) => setF({ ...f, coefficient: Number(e.target.value) || 1 })} />
          </div>
          <div>
            <label className="text-xs font-bold text-[#8A6d9e] block">Crédits</label>
            <input className="field mt-1 w-full" type="number" value={f.credits} onChange={(e) => setF({ ...f, credits: Number(e.target.value) || 3 })} />
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-[#8A6d9e] mb-1">Couleur</p>
          <div className="flex flex-wrap gap-1.5">{PASTELS.map((c) => (
            <button key={c} onClick={() => setF({ ...f, color: c })} className={`w-8 h-8 rounded-full border-[3px] ${f.color === c ? "border-[#5B4A6F]" : "border-white"} shadow`} style={{ background: c }} />
          ))}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-[#8A6d9e] mb-1">Icône</p>
          <div className="flex flex-wrap gap-1.5">{["BookOpen", "SpellCheck", "Languages", "GraduationCap", "HeartHandshake", "Landmark", "PenLine", "AudioLines", "Feather", "LibraryBig", "Sparkles", "Globe"].map((ic) => (
            <button key={ic} onClick={() => setF({ ...f, icon: ic })} className={`p-2 rounded-xl border-2 ${f.icon === ic ? "border-pink-400 bg-pink-50" : "border-pink-100 bg-white"}`}><Icon name={ic} size={19} color="#e06aa0" /></button>))}
          </div>
        </div>
        <div className="flex gap-2">
          <CuteButton className="bg-pink-500 text-white flex-1 justify-center font-[Baloo_2] text-sm font-bold" onClick={save}>
            {initial ? "Enregistrer" : "Créer la matière"}
          </CuteButton>
          {initial && (
            <CuteButton className="bg-red-50 text-red-400" onClick={remove}><Trash2 size={16} /></CuteButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
