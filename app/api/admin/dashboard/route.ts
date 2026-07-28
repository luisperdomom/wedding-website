import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

function serializeDocument(
  document: FirebaseFirestore.QueryDocumentSnapshot,
) {
  const data = document.data();
  return {
    id: document.id,
    ...data,
    created: data.created?.toDate?.().toISOString() ?? data.created ?? null,
    createdAt:
      data.createdAt?.toDate?.().toISOString() ?? data.createdAt ?? null,
  };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const [rsvpSnapshot, guestSnapshot] = await Promise.all([
      adminDb.collection("rsvp").get(),
      adminDb.collection("guests").get(),
    ]);

    return NextResponse.json({
      rsvps: rsvpSnapshot.docs.map(serializeDocument),
      guests: guestSnapshot.docs.map(serializeDocument),
    });
  } catch (error) {
    console.error("No se pudo cargar el dashboard:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los datos." },
      { status: 500 },
    );
  }
}
