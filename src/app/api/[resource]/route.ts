import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { RESOURCES, clean } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const table = RESOURCES[resource];
  if (!table) return NextResponse.json({ error: "unknown resource" }, { status: 404 });
  const rows = await db.select().from(table).orderBy(asc(table.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const table = RESOURCES[resource];
  if (!table) return NextResponse.json({ error: "unknown resource" }, { status: 404 });
  const body = await req.json();
  const [row] = await (db as any).insert(table).values(clean(table, body)).returning();
  return NextResponse.json(row, { status: 201 });
}
