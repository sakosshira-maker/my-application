import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { RESOURCES, clean } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const table = RESOURCES[resource];
  if (!table) return NextResponse.json({ error: "unknown resource" }, { status: 404 });
  const body = await req.json();
  const values = clean(table, body);
  if ("updatedAt" in table) (values as any).updatedAt = new Date();
  const [row] = await (db as any).update(table).set(values).where(eq(table.id, Number(id))).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const table = RESOURCES[resource];
  if (!table) return NextResponse.json({ error: "unknown resource" }, { status: 404 });
  await db.delete(table).where(eq(table.id, Number(id)));
  return NextResponse.json({ ok: true });
}
