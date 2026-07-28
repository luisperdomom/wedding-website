import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const FIXED_CHOICES = new Set([
  "Sí asistiré",
  "No podré asistir",
  "Ambos asistiremos",
  "Ninguno asistirá",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      guestId?: unknown;
      token?: unknown;
      attending?: unknown;
      message?: unknown;
    };
    const guestId = typeof body.guestId === "string" ? body.guestId : "";
    const token = typeof body.token === "string" ? body.token : "";
    const attending = typeof body.attending === "string" ? body.attending : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (
      !/^[a-z0-9-]{1,100}$/.test(guestId) ||
      !token ||
      message.length > 1000
    ) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const guestRef = adminDb.collection("guests").doc(guestId);
    const rsvpRef = adminDb.collection("rsvp").doc(guestId);
    const legacyRsvp = await adminDb
      .collection("rsvp")
      .where("guestId", "==", guestId)
      .limit(1)
      .get();
    if (!legacyRsvp.empty) {
      return NextResponse.json(
        { error: "Ya recibimos esta confirmación." },
        { status: 409 },
      );
    }

    await adminDb.runTransaction(async (transaction) => {
      const [guestSnapshot, rsvpSnapshot] = await Promise.all([
        transaction.get(guestRef),
        transaction.get(rsvpRef),
      ]);
      if (!guestSnapshot.exists || guestSnapshot.data()?.token !== token) {
        throw new Error("INVALID_INVITATION");
      }
      if (rsvpSnapshot.exists) throw new Error("ALREADY_ANSWERED");

      const guest = guestSnapshot.data()!;
      const createdAt = guest.createdAt?.toDate?.();
      if (
        createdAt instanceof Date &&
        Date.now() > createdAt.getTime() + INVITATION_DURATION_MS
      ) {
        throw new Error("EXPIRED");
      }

      const individualChoices = [
        `Solo asistirá ${guest.name}`,
        ...(guest.companion ? [`Solo asistirá ${guest.companion}`] : []),
      ];
      if (!FIXED_CHOICES.has(attending) && !individualChoices.includes(attending)) {
        throw new Error("INVALID_CHOICE");
      }

      const guestName = guest.companion
        ? `${guest.name} y ${guest.companion}`
        : guest.name;
      transaction.create(rsvpRef, {
        guestId,
        guestName,
        attending,
        message,
        created: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const knownErrors: Record<string, [string, number]> = {
      INVALID_INVITATION: ["La invitación no es válida.", 401],
      ALREADY_ANSWERED: ["Ya recibimos esta confirmación.", 409],
      EXPIRED: ["El período de confirmación ha concluido.", 410],
      INVALID_CHOICE: ["La selección de asistencia no es válida.", 400],
    };
    const [message, status] = knownErrors[code] ?? [
      "No se pudo guardar la confirmación.",
      500,
    ];
    if (status === 500) console.error("No se pudo guardar el RSVP:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
