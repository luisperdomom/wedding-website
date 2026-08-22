"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MomentPost {
  id: string;
  authorName: string;
  caption: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  likes: number;
  created: string | null;
  category: string;
  featured: boolean;
}

const MOMENT_CATEGORIES = ["Todos", "Los novios", "Ceremonia", "Familia", "Baile", "Detalles", "Momentos"];

export default function MomentsPage() {
  const [publisherName, setPublisherName] = useState("");
  const [posts, setPosts] = useState<MomentPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selectedCategory, setSelectedCategory] = useState("Los novios");
  const [privateForCouple, setPrivateForCouple] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"feed" | "favorites" | "summary">("feed");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [messageOnly, setMessageOnly] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async (silent = false) => {
    if (!silent) setFeedLoading(true);
    try {
      const response = await fetch("/api/moments/posts", { cache: "no-store" });
      const data = (await response.json()) as { posts?: MomentPost[]; albumOpen?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los momentos.");
      setPosts(data.posts || []);
      setAlbumOpen(data.albumOpen !== false);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedLikes = JSON.parse(localStorage.getItem("wedding_moment_likes") || "[]") as string[];
    setLikedPosts(new Set(storedLikes));
    const savedName = localStorage.getItem("wedding_moment_name") || "";
    setPublisherName(savedName);
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const refresh = () => void loadPosts(true);
    const interval = window.setInterval(refresh, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadPosts]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileSelection = (file?: File) => {
    setUploadError("");
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type === "video/mp4" || file.type === "video/quicktime";
    if (!isImage && !isVideo) {
      setUploadError("Selecciona una foto JPG, PNG o WebP, o un video MP4/MOV.");
      return;
    }
    const maxBytes = isImage ? 25 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(isImage ? "La foto no puede superar 25 MB." : "El video no puede superar 50 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const closeComposer = () => {
    if (uploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setShowComposer(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    setSelectedCategory("Los novios");
    setPrivateForCouple(false);
    setMessageOnly(false);
    setUploadError("");
    setUploadProgress("");
  };

  const handlePublish = async () => {
    const cleanPublisherName = publisherName.trim();
    if ((!selectedFile && !messageOnly) || !cleanPublisherName || (messageOnly && !caption.trim())) {
      setUploadError(messageOnly && !caption.trim() ? "Escribe tu mensaje para los novios." : "Escribe tu nombre para publicar.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      localStorage.setItem("wedding_moment_name", cleanPublisherName);
      if (messageOnly) {
        setUploadProgress("Enviando tu mensaje privado...");
        const response = await fetch("/api/moments/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorName: cleanPublisherName, caption, messageOnly: true }) });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error || "No se pudo enviar el mensaje.");
        setUploading(false); closeComposer(); await loadPosts(); return;
      }
      setUploadProgress("Preparando tu momento...");
      const prepareResponse = await fetch("/api/moments/upload-signature", {
        method: "POST",
      });
      const prepared = (await prepareResponse.json()) as {
        cloudName?: string;
        apiKey?: string;
        timestamp?: number;
        folder?: string;
        signature?: string;
        error?: string;
      };
      if (!prepareResponse.ok || !prepared.cloudName || !prepared.apiKey || !prepared.timestamp || !prepared.folder || !prepared.signature) {
        throw new Error(prepared.error || "No se pudo preparar el archivo.");
      }

      setUploadProgress(selectedFile!.type.startsWith("video/") ? "Subiendo el video..." : "Subiendo la foto...");
      const uploadData = new FormData();
      uploadData.append("file", selectedFile!);
      uploadData.append("api_key", prepared.apiKey);
      uploadData.append("timestamp", String(prepared.timestamp));
      uploadData.append("folder", prepared.folder);
      uploadData.append("signature", prepared.signature);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${prepared.cloudName}/auto/upload`, {
        method: "POST",
        body: uploadData,
      });
      const uploaded = (await uploadResponse.json()) as {
        public_id?: string;
        resource_type?: "image" | "video";
        error?: { message?: string };
      };
      if (!uploadResponse.ok || !uploaded.public_id || !uploaded.resource_type) {
        throw new Error(uploaded.error?.message || "Cloudinary no pudo recibir el archivo.");
      }

      setUploadProgress("Publicando en el álbum...");
      const publishResponse = await fetch("/api/moments/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type,
          caption,
          authorName: cleanPublisherName,
          category: selectedCategory,
          visibility: privateForCouple ? "private" : "public",
        }),
      });
      const published = (await publishResponse.json()) as { error?: string };
      if (!publishResponse.ok) throw new Error(published.error || "No se pudo publicar.");
      setUploading(false);
      closeComposer();
      await loadPosts();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "No se pudo publicar el momento.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const openQuickPicker = () => {
    if (!albumOpen) return;
    quickFileInputRef.current?.click();
  };

  const modePosts = viewMode === "favorites" ? posts.filter((post) => post.featured) : posts;
  const visiblePosts = activeCategory === "Todos" ? modePosts : modePosts.filter((post) => post.category === activeCategory);

  useEffect(() => {
    if (!playing || lightboxIndex === null || visiblePosts.length < 2) return;
    const timer = window.setInterval(() => setLightboxIndex((current) => current === null ? 0 : (current + 1) % visiblePosts.length), 5000);
    return () => window.clearInterval(timer);
  }, [playing, lightboxIndex, visiblePosts.length]);

  const downloadUrl = (url: string) => url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;

  const toggleLike = async (post: MomentPost) => {
    const wasLiked = likedPosts.has(post.id);
    const next = new Set(likedPosts);
    if (wasLiked) next.delete(post.id); else next.add(post.id);
    setLikedPosts(next);
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likes: Math.max(0, item.likes + (wasLiked ? -1 : 1)) } : item));
    localStorage.setItem("wedding_moment_likes", JSON.stringify([...next]));
    await fetch(`/api/moments/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: wasLiked ? -1 : 1 }),
    }).catch(() => undefined);
  };

  return (
    <main className="min-h-screen bg-[#F5F1EA] pb-28">
      <header className="bg-[#3A2A23] text-white px-5 pt-8 pb-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,162,124,0.25),transparent_45%)]" />
        <div className="relative max-w-2xl mx-auto">
          <p
            className="text-[clamp(28px,8vw,44px)] uppercase text-[#d9b58d]"
            style={{
              fontFamily: "var(--font-elegant)",
              fontWeight: 300,
              letterSpacing: "clamp(5px,2vw,10px)",
            }}
          >
            Luis & Ailyn
          </p>
          <h1 className="text-xl mt-3 font-light tracking-[1px]">La boda desde sus ojos</h1>
          <p className="text-xs text-white/60 mt-2">Ayúdanos a guardar nuestra boda desde tus ojos.</p>
        </div>
      </header>

      <section className="max-w-xl mx-auto px-4 -mt-14 relative">
        <div className="bg-white rounded-2xl border border-[#e5e0d8] shadow-[0_15px_45px_rgba(58,42,35,0.08)] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#F5F1EA] grid place-items-center text-[#C7A27C] text-lg">✦</div>
            <div className="min-w-0"><p className="text-xs text-[#8a8178]">Bienvenido al álbum</p><p className="font-semibold text-sm truncate">Comparte un momento</p></div>
          </div>
          <button onClick={openQuickPicker} disabled={!albumOpen} className="shrink-0 bg-[#7A8468] hover:bg-[#697458] disabled:bg-gray-300 text-white rounded-xl px-4 py-3 text-xs font-semibold cursor-pointer disabled:cursor-not-allowed transition-colors">＋ {albumOpen ? "Compartir" : "Álbum cerrado"}</button>
        </div>

        {albumOpen && <button onClick={() => { setMessageOnly(true); setPrivateForCouple(true); setShowComposer(true); }} className="w-full mt-3 py-3 rounded-xl border border-[#C7A27C]/50 bg-white/80 text-xs text-[#795f49] cursor-pointer">💌 Dejar un mensaje privado para los novios</button>}

        <input
          ref={quickFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleFileSelection(file);
              setShowComposer(true);
            }
            event.target.value = "";
          }}
        />

        <div className="flex gap-3 overflow-x-auto py-6 [scrollbar-width:none]">
          {MOMENT_CATEGORIES.map((label, index) => (
            <button key={label} onClick={() => setActiveCategory(label)} className="shrink-0 text-center cursor-pointer"><div className={`w-16 h-16 rounded-full p-[2px] ${activeCategory === label ? "bg-gradient-to-br from-[#C7A27C] to-[#7A8468]" : "bg-[#ddd5cc]"}`}><div className="w-full h-full rounded-full bg-white grid place-items-center text-xl">{["✦", "🤍", "💍", "🥂", "✨", "🌿", "📷"][index]}</div></div><span className={`text-[10px] mt-1 block ${activeCategory === label ? "text-[#3A2A23] font-semibold" : "text-[#8a8178]"}`}>{label}</span></button>
          ))}
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {([['feed', 'Todos'], ['favorites', 'Favoritos'], ['summary', 'Resumen']] as const).map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-full text-xs border cursor-pointer ${viewMode === mode ? "bg-[#3A2A23] text-white border-[#3A2A23]" : "bg-white text-[#7a6d64] border-[#ddd5cc]"}`}>{label}</button>
          ))}
        </div>

        <div className="mb-6 rounded-2xl border border-[#C7A27C]/25 bg-white/70 px-5 py-4 text-center">
          <p className="text-sm leading-relaxed text-[#6f6259]" style={{ fontFamily: "var(--font-serif)" }}>
            Este álbum está dedicado a nuestra historia. Comparte esas fotos y videos donde los novios,
            la ceremonia y los momentos especiales de la boda sean los protagonistas. 🤍
          </p>
        </div>

        {viewMode === "summary" && !feedLoading ? (
          <div className="bg-[#3A2A23] text-white rounded-[28px] p-7 sm:p-10 text-center shadow-xl">
            <p className="text-[#d9b58d] text-xs uppercase tracking-[3px]">Nuestro día en recuerdos</p>
            <h2 className="text-3xl mt-3" style={{ fontFamily: "var(--font-serif)" }}>Luis & Ailyn</h2>
            <div className="grid grid-cols-3 gap-3 my-8"><div><strong className="text-2xl block">{posts.length}</strong><span className="text-[10px] text-white/60">momentos</span></div><div><strong className="text-2xl block">{posts.filter(p => p.featured).length}</strong><span className="text-[10px] text-white/60">favoritos</span></div><div><strong className="text-2xl block">{posts.reduce((sum,p) => sum + p.likes, 0)}</strong><span className="text-[10px] text-white/60">corazones</span></div></div>
            <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">{posts.filter(p => p.mediaType === "image").slice(0, 9).map((post, index) => <img key={post.id} src={post.mediaUrl} alt="" onClick={() => { setViewMode("feed"); setLightboxIndex(index); }} className="aspect-square object-cover cursor-pointer" />)}</div>
            {posts.length > 0 && <button onClick={() => { setViewMode("feed"); setLightboxIndex(0); setPlaying(true); }} className="mt-8 bg-[#C7A27C] text-[#2f211b] px-6 py-3 rounded-full text-xs font-semibold cursor-pointer">▶ Ver presentación</button>}
          </div>
        ) : feedLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center text-sm text-[#8a8178] animate-pulse">Cargando momentos...</div>
        ) : visiblePosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e5e0d8] p-12 text-center"><p className="text-3xl">📷</p><h2 className="mt-4 text-lg">El primer momento espera por ti</h2><p className="text-sm text-[#8a8178] mt-2">Comparte una foto o video para comenzar nuestro álbum.</p></div>
        ) : (
          <div className="flex flex-col gap-5">
            {visiblePosts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl border border-[#e5e0d8] overflow-hidden shadow-sm">
                <div className="px-4 py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#F5F1EA] grid place-items-center text-[#C7A27C]">♡</div><div className="flex-1"><p className="text-sm font-semibold">{post.authorName}</p><p className="text-[10px] text-[#aaa198]">{post.created ? new Date(post.created).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" }) : "Ahora"} · {post.category}</p></div>{post.featured && <span className="text-[10px] uppercase tracking-[0.8px] text-[#9a681f] bg-[#fff4df] px-2 py-1 rounded-full">Favorito</span>}</div>
                <button className="block w-full cursor-zoom-in" onClick={() => setLightboxIndex(visiblePosts.findIndex(item => item.id === post.id))}>{post.mediaType === "image" ? <img src={post.mediaUrl} alt={post.caption || `Momento compartido por ${post.authorName}`} className="w-full max-h-[680px] object-cover bg-[#eee8df]" /> : <video src={post.mediaUrl} playsInline preload="metadata" className="w-full max-h-[680px] bg-black" />}</button>
                <div className="p-4">
                  <div className="flex justify-between items-center"><button onClick={() => void toggleLike(post)} className={`text-2xl cursor-pointer transition-transform active:scale-125 ${likedPosts.has(post.id) ? "text-red-500" : "text-[#3A2A23]"}`} aria-label="Me encanta">{likedPosts.has(post.id) ? "♥" : "♡"}</button><a href={downloadUrl(post.mediaUrl)} className="text-xs text-[#7A8468]" aria-label="Descargar">⇩ Descargar</a></div>
                  <p className="text-xs font-semibold mt-1">{post.likes} {post.likes === 1 ? "corazón" : "corazones"}</p>
                  {post.caption && <p className="text-sm mt-2 leading-relaxed"><span className="font-semibold mr-2">{post.authorName}</span>{post.caption}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {lightboxIndex !== null && visiblePosts[lightboxIndex] && <div className="fixed inset-0 z-[60] bg-black/95 text-white flex flex-col" role="dialog" aria-modal="true"><div className="p-4 flex items-center justify-between"><p className="text-xs text-white/70">{lightboxIndex + 1} de {visiblePosts.length}</p><div className="flex gap-3"><button onClick={() => setPlaying(value => !value)} className="px-3 py-2 rounded-full bg-white/10 cursor-pointer text-xs">{playing ? "❚❚ Pausar" : "▶ Presentación"}</button><a href={downloadUrl(visiblePosts[lightboxIndex].mediaUrl)} className="px-3 py-2 rounded-full bg-white/10 text-xs">⇩ Descargar</a><button onClick={() => { setLightboxIndex(null); setPlaying(false); }} className="text-3xl cursor-pointer">×</button></div></div><div className="flex-1 min-h-0 flex items-center justify-center relative px-12">{visiblePosts[lightboxIndex].mediaType === "image" ? <img src={visiblePosts[lightboxIndex].mediaUrl} alt="" className="max-w-full max-h-full object-contain" /> : <video key={visiblePosts[lightboxIndex].id} src={visiblePosts[lightboxIndex].mediaUrl} controls autoPlay={playing} playsInline className="max-w-full max-h-full" />}<button onClick={() => setLightboxIndex((lightboxIndex - 1 + visiblePosts.length) % visiblePosts.length)} className="absolute left-2 text-4xl cursor-pointer">‹</button><button onClick={() => setLightboxIndex((lightboxIndex + 1) % visiblePosts.length)} className="absolute right-2 text-4xl cursor-pointer">›</button></div><div className="p-4 text-center"><p className="font-semibold">{visiblePosts[lightboxIndex].authorName}</p><p className="text-sm text-white/70">{visiblePosts[lightboxIndex].caption}</p></div></div>}

      {albumOpen && <button onClick={openQuickPicker} className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-[#3A2A23] text-white shadow-[0_10px_30px_rgba(58,42,35,0.3)] text-2xl cursor-pointer sm:hidden z-40" aria-label="Abrir cámara o galería">＋</button>}

      {showComposer && (
        <div className="fixed inset-0 z-50 bg-[#2a1d18]/70 backdrop-blur-sm p-4 grid place-items-center" onMouseDown={(event) => event.target === event.currentTarget && closeComposer()}>
          <div className="w-full max-w-lg bg-white rounded-[24px] overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-[#e5e0d8] flex items-center justify-between"><h2 className="text-lg">{messageOnly ? "Mensaje para los novios" : "Compartir un momento"}</h2><button onClick={closeComposer} className="text-2xl text-[#8a8178] cursor-pointer" aria-label="Cerrar">×</button></div>
            <div className="p-5">
              <div className="mb-4 rounded-xl bg-[#FAF8F5] border border-[#e5e0d8] px-4 py-3">
                <p className="text-xs text-[#7a6d64] leading-relaxed text-center">
                  Elige un recuerdo bonito de los novios o de algún momento especial de la celebración.
                  Queremos conservar este álbum tan significativo como el día que compartimos. ✨
                </p>
              </div>
              {messageOnly ? <div className="rounded-2xl bg-[#F5F1EA] border border-[#e5e0d8] p-7 text-center"><p className="text-4xl">💌</p><p className="mt-3 text-sm text-[#6f6259]">Este mensaje será privado y solamente lo verán Luis y Ailyn.</p></div> : !selectedFile ? (
                <label className="min-h-64 rounded-2xl border-2 border-dashed border-[#d7cec4] bg-[#FAF8F5] grid place-items-center text-center p-8 cursor-pointer hover:border-[#C7A27C] transition-colors"><div><p className="text-4xl">📸</p><p className="font-semibold mt-4">Elige una foto o video</p><p className="text-xs text-[#8a8178] mt-2">JPG, PNG, WebP, MP4 o MOV</p></div><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" className="sr-only" onChange={(event) => handleFileSelection(event.target.files?.[0])} /></label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black">{selectedFile.type.startsWith("image/") ? <img src={previewUrl} alt="Vista previa" className="w-full max-h-80 object-contain" /> : <video src={previewUrl} controls playsInline className="w-full max-h-80" />}<button onClick={() => { setSelectedFile(null); setPreviewUrl(""); }} className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 cursor-pointer">×</button></div>
              )}
              <label className="block mt-4 text-[10px] uppercase tracking-[1px] text-[#8a8178] font-semibold">Tu nombre</label>
              <input value={publisherName} onChange={(event) => setPublisherName(event.target.value)} maxLength={60} placeholder="¿Cómo quieres aparecer?" className="mt-2 w-full px-4 py-3.5 rounded-xl border border-[#e5e0d8] bg-[#FAF8F5] text-sm outline-none focus:border-[#C7A27C]" />
              <label className="block mt-4 text-[10px] uppercase tracking-[1px] text-[#8a8178] font-semibold">Categoría</label>
              <div className="flex gap-2 overflow-x-auto mt-2 pb-1 [scrollbar-width:none]">
                {MOMENT_CATEGORIES.slice(1).map((category) => (
                  <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`shrink-0 px-3 py-2 rounded-full text-xs border cursor-pointer ${selectedCategory === category ? "bg-[#3A2A23] border-[#3A2A23] text-white" : "bg-white border-[#e5e0d8] text-[#8a8178]"}`}>{category}</button>
                ))}
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#e5e0d8] bg-[#FAF8F5] p-3 cursor-pointer">
                <input type="checkbox" checked={privateForCouple} onChange={(event) => setPrivateForCouple(event.target.checked)} className="mt-0.5 accent-[#7A8468]" />
                <span className="text-xs text-[#6f6259] leading-relaxed"><strong>Solo para los novios:</strong> no aparecerá en el feed público, pero sí en su panel privado.</span>
              </label>
              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={300} placeholder="Escribe algo sobre este momento... (opcional)" className="mt-4 w-full min-h-24 p-4 rounded-xl border border-[#e5e0d8] bg-[#FAF8F5] text-sm outline-none focus:border-[#C7A27C] resize-none" />
              <div className="text-right text-[10px] text-[#aaa198]">{caption.length}/300</div>
              {uploadError && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg p-3">{uploadError}</p>}
              {uploadProgress && <p className="mt-3 text-xs text-[#7A8468] text-center animate-pulse">{uploadProgress}</p>}
              <button onClick={() => void handlePublish()} disabled={(!selectedFile && !messageOnly) || !publisherName.trim() || (messageOnly && !caption.trim()) || uploading} className="mt-4 w-full bg-[#3A2A23] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl py-4 text-xs uppercase tracking-[2px] font-semibold cursor-pointer disabled:cursor-not-allowed">{uploading ? "Publicando..." : messageOnly ? "Enviar mensaje privado" : "Publicar momento"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
