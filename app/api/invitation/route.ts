import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const guestId = url.searchParams.get("guest");
  const token = url.searchParams.get("token");
  if (!guestId || !token || !/^[a-z0-9-]{1,100}$/.test(guestId)) {
    return NextResponse.json({ valid: false });
  }

  try {
    const adminDb = getAdminDb();
    const guestSnapshot = await adminDb.collection("guests").doc(guestId).get();
    if (!guestSnapshot.exists || guestSnapshot.data()?.token !== token) {
      return NextResponse.json({ valid: false });
    }

    const guest = guestSnapshot.data()!;
    const createdAt = guest.createdAt?.toDate?.();
    const expired =
      createdAt instanceof Date &&
      Date.now() > createdAt.getTime() + INVITATION_DURATION_MS;
    const rsvpSnapshot = await adminDb.collection("rsvp").doc(guestId).get();
    const legacyRsvpSnapshot = rsvpSnapshot.exists
      ? null
      : await adminDb
          .collection("rsvp")
          .where("guestId", "==", guestId)
          .limit(1)
          .get();
    const existingRsvp = rsvpSnapshot.exists
      ? rsvpSnapshot.data()
      : legacyRsvpSnapshot?.docs[0]?.data();

    return NextResponse.json({
      valid: true,
      guest: {
        name: guest.name,
        companion: guest.companion ?? "",
      },
      expired,
      answered: Boolean(existingRsvp),
      attending: existingRsvp?.attending ?? null,
    });
  } catch (error) {
    console.error("No se pudo validar la invitación:", error);
    return NextResponse.json(
      { error: "No se pudo validar la invitación." },
      { status: 500 },
    );
  }
}
