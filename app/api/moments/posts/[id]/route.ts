import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCloudinary } from "@/lib/cloudinary";
import { getAdminDb } from "@/lib/firebase-admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { delta?: unknown; action?: unknown };
  const action = typeof body.action === "string" ? body.action : "";
  if (action) {
    if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    if (!/^[A-Za-z0-9]{1,30}$/.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    const ref = getAdminDb().collection("moments").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    if (action === "hide") await ref.update({ status: "hidden" });
    else if (action === "restore") await ref.update({ status: "published" });
    else if (action === "toggle-featured") await ref.update({ featured: snapshot.data()?.featured !== true });
    else return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const delta = body.delta === 1 ? 1 : body.delta === -1 ? -1 : 0;
  if (!/^[A-Za-z0-9]{1,30}$/.test(id) || !delta) {
    return NextResponse.json({ error: "Reacción inválida." }, { status: 400 });
  }
  await getAdminDb().collection("moments").doc(id).update({ likes: FieldValue.increment(delta) });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[A-Za-z0-9]{1,30}$/.test(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  const ref = getAdminDb().collection("moments").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  const publicId = snapshot.data()?.publicId;
  const resourceType = snapshot.data()?.mediaType;
  await ref.delete();
  if (publicId && (resourceType === "image" || resourceType === "video")) {
    await getCloudinary().cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
