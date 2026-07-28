import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey() {
  const encodedValue = process.env.FIREBASE_ADMIN_PRIVATE_KEY_BASE64;
  if (encodedValue) {
    return Buffer.from(encodedValue.trim(), "base64").toString("utf8");
  }

  const value = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!value) {
    throw new Error(
      "FIREBASE_ADMIN_PRIVATE_KEY_BASE64 o FIREBASE_ADMIN_PRIVATE_KEY no está configurada.",
    );
  }
  return value.trim().replace(/\\n/g, "\n");
}

export function getAdminDb() {
  const adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  return getFirestore(adminApp);
}
