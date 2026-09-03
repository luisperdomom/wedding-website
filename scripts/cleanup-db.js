const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getPrivateKey() {
  const encoded = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;
  if (encoded) return Buffer.from(encoded.trim(), "base64").toString("utf8");
  const value = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!value) throw new Error("Falta la clave privada de Firebase Admin.");
  return value.trim().replace(/\\n/g, "\n");
}

const app = getApps()[0] || initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: getPrivateKey(),
  }),
});
const db = getFirestore(app);

async function cleanCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  for (let start = 0; start < snapshot.docs.length; start += 400) {
    const batch = db.batch();
    snapshot.docs.slice(start, start + 400).forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }
  console.log(`Se eliminaron ${snapshot.size} documentos de "${collectionName}".`);
  return snapshot.size;
}

async function main() {
  const rsvps = await cleanCollection("rsvp");
  const guests = await cleanCollection("guests");
  console.log(`Limpieza completada: ${guests} invitados y ${rsvps} confirmaciones.`);
}

main().catch((error) => {
  console.error("Error al limpiar la base de datos:", error);
  process.exitCode = 1;
});
