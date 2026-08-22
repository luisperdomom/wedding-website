import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCloudinary } from "@/lib/cloudinary";
import { getAdminDb } from "@/lib/firebase-admin";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function GET() {
  const isAdmin = await isAdminAuthenticated();
  try {
    const db = getAdminDb();
    const [snapshot, settingsSnapshot] = await Promise.all([
      db.collection("moments").orderBy("created", "desc").limit(100).get(),
      db.collection("settings").doc("moments").get(),
    ]);
    const { cloudinary } = getCloudinary();
    const posts = snapshot.docs
      .filter((document) => isAdmin || (document.data().status !== "hidden" && document.data().visibility !== "private"))
      .map((document) => {
        const data = document.data();
        const optimizedUrl = data.publicId
          ? cloudinary.url(data.publicId, {
              resource_type: data.mediaType,
              secure: true,
              transformation:
                data.mediaType === "image"
                  ? [{ width: 1400, crop: "limit", quality: "auto", fetch_format: "auto" }]
                  : [{ quality: "auto" }],
            })
          : data.mediaUrl;
        return {
          id: document.id,
          authorName: data.authorName,
          caption: data.caption ?? "",
          mediaType: data.mediaType,
          mediaUrl: optimizedUrl,
          likes: data.likes ?? 0,
          status: data.status ?? "published",
          category: data.category ?? "Momentos",
          visibility: data.visibility ?? "public",
          featured: data.featured === true,
          publicId: isAdmin ? data.publicId ?? null : undefined,
          created: data.created?.toDate?.().toISOString() ?? null,
        };
      });
    posts.sort((a, b) => Number(b.featured) - Number(a.featured));
    return NextResponse.json({ posts, albumOpen: settingsSnapshot.data()?.open !== false });
  } catch (error) {
    console.error("No se pudieron cargar los momentos:", error);
    return NextResponse.json({ error: "No se pudieron cargar los momentos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      publicId?: unknown;
      resourceType?: unknown;
      caption?: unknown;
      authorName?: unknown;
      category?: unknown;
      visibility?: unknown;
      messageOnly?: unknown;
    };
    const publicId = typeof body.publicId === "string" ? body.publicId : "";
    const resourceType = body.resourceType === "image" ? "image" : body.resourceType === "video" ? "video" : "";
    const caption = typeof body.caption === "string" ? body.caption.trim() : "";
    const authorName = typeof body.authorName === "string" ? body.authorName.trim() : "";
    const allowedCategories = new Set(["Los novios", "Ceremonia", "Familia", "Baile", "Detalles", "Momentos"]);
    const category = typeof body.category === "string" && allowedCategories.has(body.category) ? body.category : "Momentos";
    const visibility = body.visibility === "private" ? "private" : "public";
    const messageOnly = body.messageOnly === true;
    if ((!messageOnly && (!/^wedding-moments\/[A-Za-z0-9_-]+$/.test(publicId) || !resourceType)) || !authorName || authorName.length > 60 || caption.length > 300 || (messageOnly && !caption)) {
      return NextResponse.json({ error: "Publicación inválida." }, { status: 400 });
    }

    if (messageOnly) {
      await getAdminDb().collection("moments").doc().create({
        authorName, caption, mediaType: "message", mediaUrl: "", publicId: null,
        category: "Mensajes", visibility: "private", featured: false, likes: 0,
        status: "published", created: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const { cloudinary } = getCloudinary();
    const asset = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    const size = Number(asset.bytes ?? 0);
    const maxBytes = resourceType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (!size || size > maxBytes || !asset.secure_url) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => undefined);
      return NextResponse.json({ error: "El archivo supera el tamaño permitido." }, { status: 400 });
    }

    await getAdminDb().collection("moments").doc().create({
      authorName,
      caption,
      mediaType: resourceType,
      mediaUrl: asset.secure_url,
      publicId,
      category,
      visibility,
      featured: false,
      likes: 0,
      status: "published",
      created: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("No se pudo publicar el momento:", error);
    return NextResponse.json({ error: "No se pudo publicar el momento." }, { status: 500 });
  }
}
