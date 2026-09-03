import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { MAX_COMPANIONS, normalizeCompanions } from "@/lib/guest-names";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createToken() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length])
    .join("");
}

function createSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const body = (await request.json()) as {
      name?: unknown;
      phone?: unknown;
      companion?: unknown;
      companions?: unknown;
    };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const companions = normalizeCompanions(body.companions, body.companion);

    if (!name || name.length > 120 || phone.length > 30 || companions.length > MAX_COMPANIONS || companions.some((item) => item.length > 120)) {
      return NextResponse.json({ error: "Datos del invitado inválidos." }, { status: 400 });
    }

    const baseSlug = createSlug(name);
    if (!baseSlug) {
      return NextResponse.json({ error: "El nombre no genera un ID válido." }, { status: 400 });
    }

    let id = baseSlug;
    let suffix = 2;
    while ((await adminDb.collection("guests").doc(id).get()).exists) {
      id = `${baseSlug}-${suffix++}`;
    }

    const token = createToken();
    const payload = {
      name,
      token,
      createdAt: FieldValue.serverTimestamp(),
      ...(phone ? { phone } : {}),
      ...(companions.length ? { companions } : {}),
    };
    await adminDb.collection("guests").doc(id).create(payload);

    return NextResponse.json(
      { guest: { id, name, token, phone, companions, createdAt: new Date().toISOString() } },
      { status: 201 },
    );
  } catch (error) {
    console.error("No se pudo crear el invitado:", error);
    return NextResponse.json({ error: "No se pudo crear el invitado." }, { status: 500 });
  }
}
