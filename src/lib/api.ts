export interface Module {
  id: number;
  name: string;
  short: string;
  color: string;
  icon: string;
  teacher: string;
  coefficient: number;
  credits: number;
  description: string;
}

export interface Slot {
  id: number;
  moduleId: number;
  day: number | string;
  startTime: string;
  endTime: string;
  room: string;
  kind: string;
}

export interface Notebook {
  id: number;
  moduleId: number;
  title: string;
  coverColor: string;
  coverIcon: string;
  kind: string;
}

export interface Doubt {
  id: number;
  moduleId: number | null;
  question: string;
  answer: string;
  resolved: boolean;
}

export async function apiList<T>(resource: string): Promise<T[]> {
  const r = await fetch(`/api/${resource}`, { cache: "no-store" });
  if (!r.ok) return [];
  return r.json();
}

export async function apiCreate<T>(resource: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(`/api/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("create failed");
  return r.json();
}

export async function apiUpdate<T>(resource: string, id: number | string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(`/api/${resource}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("update failed");
  return r.json();
}

export async function apiDelete(resource: string, id: number | string): Promise<void> {
  await fetch(`/api/${resource}/${id}`, { method: "DELETE" });
}
