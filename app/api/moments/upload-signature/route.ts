import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST() {
  try {
    const settings = await getAdminDb().collection("settings").doc("moments").get();
    if (settings.data()?.open === false) {
      return NextResponse.json({ error: "El álbum ya no acepta nuevas publicaciones." }, { status: 403 });
    }
    const { cloudinary, cloudName, apiKey, apiSecret } = getCloudinary();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "wedding-moments";
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
  } catch (error) {
    console.error("No se pudo preparar la carga en Cloudinary:", error);
    return NextResponse.json({ error: "No se pudo preparar la carga." }, { status: 500 });
  }
}
