import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { MAX_COMPANIONS, normalizeCompanions } from "@/lib/guest-names";

const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_IMPORT_ROWS = 200;

function createToken() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join("");
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
    const body = (await request.json()) as {
      guests?: Array<{ name?: unknown; phone?: unknown; companion?: unknown; companions?: unknown }>;
    };
    if (!Array.isArray(body.guests) || body.guests.length === 0 || body.guests.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { error: `La importación debe contener entre 1 y ${MAX_IMPORT_ROWS} invitados.` },
        { status: 400 },
      );
    }

    const rows = body.guests.map((row, index) => ({
      row: index + 2,
      name: typeof row.name === "string" ? row.name.trim() : "",
      phone: typeof row.phone === "string" ? row.phone.trim() : "",
      companions: normalizeCompanions(row.companions, row.companion),
    }));
    const invalid = rows.find(
      (row) => !row.name || row.name.length > 120 || row.phone.length > 30 || row.companions.length > MAX_COMPANIONS || row.companions.some((name) => name.length > 120),
    );
    if (invalid) {
      return NextResponse.json(
        { error: `La fila ${invalid.row} contiene datos inválidos.` },
        { status: 400 },
      );
    }

    const duplicateKeys = new Set<string>();
    for (const row of rows) {
      const key = `${row.name.toLocaleLowerCase("es")}::${row.phone.replace(/\D/g, "")}`;
      if (duplicateKeys.has(key)) {
        return NextResponse.json(
          { error: `La fila ${row.row} está duplicada dentro del archivo.` },
          { status: 400 },
        );
      }
      duplicateKeys.add(key);
    }

    const adminDb = getAdminDb();
    const existingSnapshot = await adminDb.collection("guests").get();
    const usedIds = new Set(existingSnapshot.docs.map((document) => document.id));
    const batch = adminDb.batch();
    const imported = rows.map((row) => {
      const baseSlug = createSlug(row.name);
      if (!baseSlug) throw new Error(`INVALID_SLUG:${row.row}`);
      let id = baseSlug;
      let suffix = 2;
      while (usedIds.has(id)) id = `${baseSlug}-${suffix++}`;
      usedIds.add(id);

      const token = createToken();
      batch.create(adminDb.collection("guests").doc(id), {
        name: row.name,
        token,
        createdAt: FieldValue.serverTimestamp(),
        ...(row.phone ? { phone: row.phone } : {}),
        ...(row.companions.length ? { companions: row.companions } : {}),
      });
      return { id, name: row.name, token, phone: row.phone, companions: row.companions };
    });

    await batch.commit();
    const createdAt = new Date().toISOString();
    return NextResponse.json({
      guests: imported.map((guest) => ({ ...guest, createdAt })),
      count: imported.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("INVALID_SLUG:")) {
      return NextResponse.json(
        { error: `El nombre de la fila ${message.split(":")[1]} no genera un ID válido.` },
        { status: 400 },
      );
    }
    console.error("No se pudieron importar los invitados:", error);
    return NextResponse.json({ error: "No se pudieron importar los invitados." }, { status: 500 });
  }
}
