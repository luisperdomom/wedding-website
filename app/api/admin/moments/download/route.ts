import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCloudinary } from "@/lib/cloudinary";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const snapshot = await getAdminDb().collection("moments").get();
  const assetIds = snapshot.docs.flatMap((document) => {
    const data = document.data();
    return data.publicId && (data.mediaType === "image" || data.mediaType === "video")
      ? [`${data.mediaType}/upload/${data.publicId}`]
      : [];
  });
  if (assetIds.length === 0) return NextResponse.json({ error: "No hay archivos para descargar." }, { status: 404 });
  const { cloudinary } = getCloudinary();
  const downloadUrl = cloudinary.utils.download_zip_url({
    fully_qualified_public_ids: assetIds,
    flatten_folders: true,
    use_original_filename: true,
    target_format: "zip",
  });
  return NextResponse.json({ downloadUrl, count: assetIds.length });
}
