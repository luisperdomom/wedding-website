import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { MAX_COMPANIONS, normalizeCompanions } from "@/lib/guest-names";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!/^[a-z0-9-]{1,100}$/.test(id)) {
      return NextResponse.json({ error: "Invitado inválido." }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: unknown;
      name?: unknown;
      phone?: unknown;
      companion?: unknown;
      companions?: unknown;
    };
    const action = typeof body.action === "string" ? body.action : "";
    if (action === "update-details") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const companions = normalizeCompanions(body.companions, body.companion);
      if (!name || name.length > 120 || phone.length > 30 || companions.length > MAX_COMPANIONS || companions.some((item) => item.length > 120)) {
        return NextResponse.json({ error: "Datos del invitado inválidos." }, { status: 400 });
      }

      const adminDb = getAdminDb();
      const guestRef = adminDb.collection("guests").doc(id);
      const guestSnapshot = await guestRef.get();
      if (!guestSnapshot.exists) {
        return NextResponse.json({ error: "Invitado no encontrado." }, { status: 404 });
      }
      await guestRef.update({
        name,
        phone: phone || FieldValue.delete(),
        companions: companions.length ? companions : FieldValue.delete(),
        companion: FieldValue.delete(),
      });
      return NextResponse.json({
        guest: { id, name, phone, companions },
      });
    }

    const field =
      action === "mark-invitation-sent"
        ? "invitationSentAt"
        : action === "mark-reminder-sent"
          ? "reminderSentAt"
          : null;
    if (!field) {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const guestRef = adminDb.collection("guests").doc(id);
    const guestSnapshot = await guestRef.get();
    if (!guestSnapshot.exists) {
      return NextResponse.json({ error: "Invitado no encontrado." }, { status: 404 });
    }

    // The first invitation send starts the seven-day RSVP window. Reopening
    // WhatsApp later must not extend it.
    if (field === "invitationSentAt" && guestSnapshot.data()?.invitationSentAt) {
      return NextResponse.json({ ok: true });
    }

    await guestRef.update({ [field]: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("No se pudo actualizar el estado del invitado:", error);
    return NextResponse.json({ error: "No se pudo actualizar el invitado." }, { status: 500 });
  }
}
