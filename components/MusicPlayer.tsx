"use client";

import { useEffect, useRef, useState } from "react";

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
      <section className="section-light !py-24" style={{ textAlign: "center" }}>
        <div className="divider"></div>

        <h2 
          className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          Nuestra Canción
        </h2>

        <p 
          className="mb-7 tracking-[0.3px] text-[20px] text-[#8a8178] max-w-[700px] mx-auto"
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          La música siempre ha sido parte de nuestra historia.
          Esta canción representa momentos, recuerdos
          y todo lo que sentimos al comenzar esta nueva etapa juntos.
        </p>

        <p 
          className="mb-7 tracking-[2px] text-[12px] text-[#8a8178] uppercase"
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          🎧 DALE PLAY PARA ESCUCHAR NUESTRA CANCIÓN
        </p>

        <button
          onClick={toggleMusic}
          className="button button-dark cursor-pointer text-[14px] tracking-[2px] px-8 py-3 rounded-full hover:opacity-90 transition-all"
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
          <span className="text-lg">🎵</span>
          <div className="absolute w-2 h-2 bg-white rounded-full border border-[#C7A27C]" />
        </div>
      </div>
    </>
  );
}
