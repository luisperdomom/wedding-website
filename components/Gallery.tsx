"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const GALLERY_PHOTOS = [
  "_JCC0180.jpg", "_JCC0204.jpg", "_JCC0232.jpg", "_JCC0236.jpg", "_JCC0251.jpg",
  "_JCC0283.jpg", "_JCC0297.jpg", "_JCC0379.jpg", "_JCC0398.jpg", "_JCC0508.jpg",
  "_JCC0520.jpg", "_JCC0534.jpg", "_JCC0659.jpg", "_JCC0731.jpg", "_JCC0794.jpg",
  "_JCC0809.jpg", "_JCC0846.jpg", "_JCC0910.jpg", "_JCC0922.jpg", "_JCC0940.jpg",
  "_JCC0969.jpg", "_JCC1032.jpg", "_JCC1112.jpg",
];

function GalleryCardImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "radial-gradient(circle, #fcfaf7 0%, #f3ede2 100%)",
      overflow: "hidden"
    }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        className={`object-cover transition-opacity duration-500 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

export default function Gallery() {
  const totalPhotos = GALLERY_PHOTOS.length;
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  // Touch gestures state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const pinching = useRef(false);
  const panStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const minSwipeDistance = 50;

  // Keyboard navigation
  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedImage((prev) => (prev === 1 ? totalPhotos : prev! - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedImage((prev) => (prev === totalPhotos ? 1 : prev! + 1));
      } else if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [selectedImage]);

  // Lock body scroll on active modal (Safari iOS scroll lock)
  useEffect(() => {
    if (selectedImage !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [first, second] = [e.touches[0], e.touches[1]];
      pinchStartDistance.current = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      pinchStartZoom.current = zoom;
      pinching.current = true;
      setTouchStart(null);
      return;
    }
    if (zoom > 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, offsetX: offset.x, offsetY: offset.y };
      return;
    }
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistance.current) {
      const [first, second] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      const nextZoom = Math.min(4, Math.max(1, pinchStartZoom.current * distance / pinchStartDistance.current));
      setZoom(nextZoom);
      if (nextZoom === 1) setOffset({ x: 0, y: 0 });
      return;
    }
    if (zoom > 1 && e.touches.length === 1) {
      setOffset({ x: panStart.current.offsetX + e.touches[0].clientX - panStart.current.x, y: panStart.current.offsetY + e.touches[0].clientY - panStart.current.y });
      return;
    }
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinching.current) {
      if (e.touches.length < 2) pinching.current = false;
      return;
    }
    if (zoom > 1) return;
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Next image
      setSelectedImage((prev) => (prev === totalPhotos ? 1 : prev! + 1));
    } else if (isRightSwipe) {
      // Previous image
      setSelectedImage((prev) => (prev === 1 ? totalPhotos : prev! - 1));
    }
  };

  // Helper to generate elegant masonry mosaic-like height rhythm
  const getCardHeight = (index: number) => {
    if (index % 3 === 0) return "h-[clamp(210px,36vw,310px)]"; // Tall card
    if (index % 2 === 0) return "h-[clamp(150px,25vw,210px)]"; // Short card
    return "h-[clamp(180px,30vw,260px)]"; // Standard card
  };

  return (
    // REMOVIDO: data-aos="zoom-in" de este contenedor raíz.
    // Esto evita el bug de CSS 3D Stacking Context que desplazaba el visor fixed hacia abajo.
    <div id="galeria" className="section-light gallery-section !py-24">
      <div className="divider"></div>

      <h2 
        data-aos="fade-up"
        className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Galería
      </h2>

      <p 
        data-aos="fade-up"
        data-aos-delay="100"
        className="mb-12 tracking-[0.3px] text-[18px] text-[#8a8178] max-w-[650px] mx-auto leading-relaxed px-4"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
      >
        Capturar instantes es nuestra forma de detener el tiempo. Les compartimos un pedacito de nuestra sesión de fotos; pequeños fragmentos de complicidad, risas y miradas que guardaremos en el corazón para siempre.
      </p>

      {/* Grid de imágenes Asimétrico / Estilo Galería de Arte */}
      <div 
        data-aos="fade-up" 
        data-aos-delay="200"
        className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-5 max-w-[1100px] mx-auto px-4 space-y-5"
      >
        {Array.from({ length: showAll ? totalPhotos : 10 }, (_, i) => i + 1).map((n) => (
          <div 
            key={n} 
            onClick={() => setSelectedImage(n)}
            className={`break-inside-avoid relative w-full ${getCardHeight(n)} cursor-pointer transition-all duration-350 hover:scale-[1.03] hover:shadow-[0_15px_30px_rgba(58,42,35,0.08)] border border-[#e5e0d8] hover:border-[#C7A27C] rounded-2xl overflow-hidden bg-white p-2`}
          >
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <GalleryCardImage
                src={`/gallery/${GALLERY_PHOTOS[n - 1]}`}
                alt={`Foto de pre-boda ${n}`}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAll((current) => !current)}
        className="button button-dark mt-12 cursor-pointer"
        style={{ fontFamily: "var(--font-elegant)", letterSpacing: "2px", fontSize: "12px" }}
        aria-expanded={showAll}
      >
        {showAll ? "VER MENOS FOTOS" : "VER GALERÍA COMPLETA"}
      </button>

      {/* Visor Fullscreen (Ahora se abrirá perfecto en el Viewport central) */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ height: "100dvh", touchAction: "none" }}
          className="fixed inset-0 bg-[#1e140f]/95 flex items-center justify-center z-[2000] select-none backdrop-blur-sm"
        >
          {/* Botón cerrar (SVG) */}
          <div
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#f5f1ea] cursor-pointer hover:bg-white/10 hover:scale-110 transition-all duration-300"
            title="Cerrar"
          >
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>

          {/* Flecha izquierda (SVG) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev === 1 ? totalPhotos : prev! - 1));
            }}
            className="hidden sm:flex absolute left-8 w-12 h-14 items-center justify-center text-white cursor-pointer select-none hover:text-[#C7A27C] hover:scale-120 transition-all duration-300"
            title="Anterior"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </div>

          {/* Imagen optimizada en el Visor */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[min(500px,90%)] h-[75vh] w-full"
            style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`, transition: pinching.current ? "none" : "transform 120ms ease-out", transformOrigin: "center" }}
          >
            <Image
              src={`/gallery/${GALLERY_PHOTOS[selectedImage - 1]}`}
              alt={`Foto seleccionada ${selectedImage}`}
              fill
              className="object-contain rounded-lg drop-shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
              priority
            />
          </div>

          {/* Flecha derecha (SVG) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev === totalPhotos ? 1 : prev! + 1));
            }}
            className="hidden sm:flex absolute right-8 w-12 h-14 items-center justify-center text-white cursor-pointer select-none hover:text-[#C7A27C] hover:scale-120 transition-all duration-300"
            title="Siguiente"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>

          {/* Contador de imágenes */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 sm:hidden rounded-full bg-black/45 border border-white/10 px-4 py-2 text-[10px] text-white/80 whitespace-nowrap pointer-events-none">
            ↔ Desliza para ver más fotos
          </div>
          <div
            className="absolute bottom-2 sm:bottom-8 text-white/70 text-xs tracking-[1px] select-none"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            {selectedImage} / {totalPhotos}
          </div>
        </div>
      )}
    </div>
  );
}
