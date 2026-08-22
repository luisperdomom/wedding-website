import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const snapshot = await getAdminDb().collection("settings").doc("moments").get();
  return NextResponse.json({ open: snapshot.data()?.open !== false });
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = (await request.json()) as { open?: unknown };
  if (typeof body.open !== "boolean") return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  await getAdminDb().collection("settings").doc("moments").set({ open: body.open }, { merge: true });
  return NextResponse.json({ ok: true, open: body.open });
}
