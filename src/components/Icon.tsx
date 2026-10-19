"use client";
import * as Lucide from "lucide-react";

export function DynIcon({ name, size, color }: { name: string; size?: number; color?: string }) {
  const Cmp = (Lucide as any)[name] || Lucide.BookOpen;
  return <Cmp size={size ?? 20} color={color} />;
}
