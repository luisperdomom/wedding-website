"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Gallery() {
  const totalPhotos = 22;
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  
  // Touch gestures state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
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

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
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

  return (
    <div id="galeria" className="section-light !py-24" data-aos="zoom-in">
      <div className="divider"></div>

      <h2 
        className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Galería
      </h2>

      <p 
        className="mb-10 tracking-[0.3px] text-[20px] text-[#8a8178]"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Momentos de nuestra sesión de pre-boda,
        recuerdos que guardaremos para siempre.
      </p>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-[1000px] mx-auto px-4">
        {Array.from({ length: totalPhotos }, (_, i) => i + 1).map((n) => (
          <div 
            key={n} 
            onClick={() => setSelectedImage(n)}
            className="relative w-full h-[clamp(160px,30vw,260px)] cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-lg overflow-hidden group"
          >
            <Image
              src={`/photo${n}.webp`}
              alt={`Foto de pre-boda ${n}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Visor Fullscreen */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 bg-[#1e140f]/92 flex items-center justify-center z-[2000] select-none"
        >
          {/* Botón cerrar */}
          <div
            onClick={() => setSelectedImage(null)}
            className="absolute top-8 right-8 text-[28px] text-[#f5f1ea] cursor-pointer tracking-[2px] hover:scale-110 transition-transform"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            ✕
          </div>

          {/* Flecha izquierda (oculta en pantallas táctiles pequeñas para mejor usabilidad con swipe) */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev === 1 ? totalPhotos : prev! - 1));
            }}
            className="hidden sm:flex absolute left-8 w-12 h-14 items-center justify-center text-[50px] text-white cursor-pointer select-none hover:scale-110 transition-transform"
          >
            ‹
          </div>

          {/* Imagen optimizada en el Visor */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[min(500px,90%)] h-[75vh] w-full"
          >
            <Image
              src={`/photo${selectedImage}.webp`}
              alt={`Foto seleccionada ${selectedImage}`}
              fill
              className="object-contain rounded-lg drop-shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              priority
            />
          </div>

          {/* Flecha derecha */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev === totalPhotos ? 1 : prev! + 1));
            }}
            className="hidden sm:flex absolute right-8 w-12 h-14 items-center justify-center text-[50px] text-white cursor-pointer select-none hover:scale-110 transition-transform"
          >
            ›
          </div>

          {/* Contador de imágenes */}
          <div
            className="absolute bottom-8 text-white/90 text-sm select-none"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            {selectedImage} / {totalPhotos}
          </div>
        </div>
      )}
    </div>
  );
}
