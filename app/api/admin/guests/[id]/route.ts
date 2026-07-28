import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!/^[a-z0-9-]{1,100}$/.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const adminDb = getAdminDb();
    await adminDb.collection("guests").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("No se pudo eliminar el invitado:", error);
    return NextResponse.json({ error: "No se pudo eliminar el invitado." }, { status: 500 });
  }
}
