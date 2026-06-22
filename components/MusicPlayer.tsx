"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll to show/hide the floating button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.log("Reproducción de audio bloqueada por el navegador:", err);
      });
    }
    setPlaying(!playing);
  };

  return (
    <>
      {/* Elemento de Audio Oculto */}
      <audio ref={audioRef} id="music" loop>
        <source src="/song.mp3" type="audio/mpeg" />
      </audio>

      {/* Sección Estándar en la Página */}
      <section className="section-light !py-24" style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="divider"></div>

        <h2 
          className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          Nuestra Canción
        </h2>

        <p 
          className="mb-10 tracking-[0.3px] text-[18px] text-[#8a8178] max-w-[650px] mx-auto leading-relaxed px-4"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          "Hay melodías que se quedan grabadas en el alma y nos acompañan en cada paso. Esta canción ha sido la banda sonora silenciosa de nuestros mejores momentos; una melodía que cuenta quiénes somos y todo lo que sentimos al dar este gran paso juntos."
        </p>

        {/* REPRODUCTOR DE VINILO (TOCADISCOS) */}
        <div className="flex flex-col items-center justify-center gap-6 my-10 select-none">
          {/* Brazo de aguja del tocadiscos (Sutil detalle decorativo en SVG) */}
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            {/* El Disco de Vinilo */}
            <div
              onClick={toggleMusic}
              style={{
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "radial-gradient(circle, #2c1a13 22%, #120b08 26%, #1c110c 42%, #120b08 46%, #20130d 62%, #0d0705 66%, #1c110c 80%, #0d0705 84%)",
                boxShadow: "0 15px 45px rgba(58, 42, 35, 0.15), inset 0 0 10px rgba(0,0,0,0.8)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid #1c110c",
                transition: "transform 0.4s ease"
              }}
              className={`hover:scale-105 active:scale-98 ${playing ? "animate-spin [animation-duration:12s]" : ""}`}
            >
              {/* Brillo de reflejo de vinilo (Rayos de luz cruzados) */}
              <div 
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "linear-gradient(45deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.02) 100%), linear-gradient(-45deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.02) 100%)",
                  pointerEvents: "none"
                }}
              />

              {/* Sticker Central del Disco (logo2.jpeg de la pareja) */}
              <div 
                style={{
                  position: "relative",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  border: "2px solid #c7a27c",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                }}
              >
                <Image
                  src="/logo2.jpeg"
                  alt="Luis & Ailyn Logo"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Agujero Central */}
              <div 
                style={{
                  position: "absolute",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#FAF8F5",
                  border: "2px solid #c7a27c",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                }}
              />

              {/* Botón Play/Pause superpuesto (Se disimula si está sonando) */}
              <div 
                style={{
                  position: "absolute",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "rgba(58, 42, 35, 0.7)",
                  border: "1px solid rgba(199, 162, 124, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FAF8F5",
                  opacity: playing ? 0 : 0.9,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none"
                }}
                className="hover:bg-[#3A2A23] shadow-md"
              >
                {playing ? (
                  /* Pause SVG Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="4" x2="18" y2="20"></line>
                    <line x1="6" y1="4" x2="6" y2="20"></line>
                  </svg>
                ) : (
                  /* Play SVG Icon */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translateX(1px)" }}>
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </div>
            </div>
          </div>

          <span 
            className="tracking-[1.5px] text-[10px] text-[#8a8178] uppercase"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            {playing ? "Tocando en vivo · Toca el disco para pausar" : "Toca el disco para escuchar"}
          </span>
        </div>

        <button
          onClick={toggleMusic}
          className="button button-dark cursor-pointer text-[13px] tracking-[2px] px-8 py-3.5 rounded-full hover:opacity-95 transition-all mt-4"
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          {playing ? "⏸ Pausar música" : "▶ Reproducir música"}
        </button>
      </section>

      {/* Widget de Control Flotante */}
      <div
        onClick={toggleMusic}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#C7A27C] cursor-pointer transition-all duration-500 backdrop-blur-md bg-white/80 text-[#3A2A23] ${
          scrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        } hover:scale-110`}
        title={playing ? "Pausar música" : "Reproducir música"}
      >
        {/* CD rotando si está reproduciéndose */}
        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border border-[#C7A27C]/30 bg-[#F5F1EA]/80 ${playing ? "animate-spin [animation-duration:8s]" : ""}`}>
          {/* Elegant Gold Music Note SVG Vector */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7A27C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill="#C7A27C" />
            <circle cx="18" cy="16" r="3" fill="#C7A27C" />
          </svg>
          <div className="absolute w-2.5 h-2.5 bg-white rounded-full border border-[#C7A27C]/50" />
        </div>
      </div>
    </>
  );
}
