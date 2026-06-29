"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface VirtualEnvelopeProps {
  guestName: string | null;
  isPlural: boolean;
  onOpen: () => void;
}

export default function VirtualEnvelope({ guestName, isPlural, onOpen }: VirtualEnvelopeProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Trigger opening steps
  const handleOpenEnvelope = () => {
    if (isOpened) return;
    setIsOpened(true);

    // Step 2: After flap opens (700ms), slide the card up
    setTimeout(() => {
      setCardRevealed(true);
    }, 700);
  };

  const handleRevealAll = () => {
    setIsFadingOut(true);
    // Wait for fade out animation (800ms) before unmounting
    setTimeout(() => {
      onOpen();
    }, 800);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#faf8f5] select-none transition-all duration-1000 ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] opacity-15 pointer-events-none">
        <Image
          src="/floral-top.png"
          alt=""
          fill
          className="object-contain object-left-top"
          priority
        />
      </div>
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] opacity-15 pointer-events-none rotate-180">
        <Image
          src="/floral-top.png"
          alt=""
          fill
          className="object-contain object-left-top"
          priority
        />
      </div>

      {/* Main Container */}
      <div className="relative flex flex-col items-center justify-center px-4 w-full max-w-[550px]">
        
        {/* Intro Instructions Header */}
        <div
          className={`text-center mb-8 transition-all duration-700 ${
            isOpened ? "opacity-0 translate-y-[-20px] pointer-events-none" : "opacity-100"
          }`}
        >
          <p
            className="text-[11px] uppercase tracking-[4px] text-[#8a8178] mb-1.5"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            Has recibido una invitación de
          </p>
          <h2
            className="text-2xl font-light text-[#3A2A23] tracking-[2px]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Luis & Ailyn
          </h2>
          <div className="w-8 h-[1px] bg-[#c7a27c] mx-auto mt-3 animate-pulse" />
          <p
            className="text-xs text-[#8a8178] italic mt-4"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Haz clic en el sello de oro para abrir
          </p>
        </div>

        {/* ENVELOPE CONTAINER & 3D STAGE */}
        <div 
          className="relative w-full aspect-[4/3] flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {/* THE SCALE WRAPPER FOR MOBILE (Ensures 100% screen-fit on smaller viewports) */}
          <div className="envelope-scale-wrapper w-full flex items-center justify-center">
            
            {/* THE ENVELOPE BOX */}
            <div
              className={`relative w-full max-w-[420px] aspect-[1.45/1] transition-all duration-1000 ${
                cardRevealed ? "translate-y-[10%] sm:translate-y-[15%]" : ""
              }`}
            >
              
              {/* 1. CARD / INVITATION (Inside the envelope, slides up) */}
              <div
                onClick={(e) => {
                  if (cardRevealed) {
                    e.stopPropagation();
                    handleRevealAll();
                  }
                }}
                style={{
                  fontFamily: "var(--font-serif)",
                  background: "linear-gradient(135deg, #fffdfa 0%, #faf6f0 100%)",
                  boxShadow: "0 10px 30px rgba(58, 42, 35, 0.08), inset 0 0 15px rgba(199, 162, 124, 0.03)",
                  border: "1px solid rgba(199, 162, 124, 0.35)",
                }}
                className={`absolute left-[5%] right-[5%] bottom-[5%] h-[90%] rounded-xl p-5 sm:p-7 flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all duration-1000 ease-out z-[2] ${
                  cardRevealed
                    ? "translate-y-[-48%] scale-102 sm:scale-105 z-[10] shadow-[0_20px_50px_rgba(58,42,35,0.15)]"
                    : "translate-y-0 opacity-40 scale-95 pointer-events-none"
                }`}
              >
                {/* Inner Double Border Frame (Explicit Style to avoid Tailwind offset bugs) */}
                <div style={{ position: "absolute", top: "10px", bottom: "10px", left: "10px", right: "10px", pointerEvents: "none" }} className="border border-double border-[#c7a27c]/20 rounded-lg" />
                <div style={{ position: "absolute", top: "15px", bottom: "15px", left: "15px", right: "15px", pointerEvents: "none" }} className="border border-[#c7a27c]/10 rounded-lg" />

                {/* Monogram Header (Using custom footer.png as requested - Responsive Size) */}
                <div className="flex flex-col items-center">
                  <div style={{ position: "relative" }} className="w-12 h-11 sm:w-16 sm:h-15">
                    <Image
                      src="/footer.png"
                      alt="Monograma Luis & Ailyn"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="w-6 sm:w-8 h-[0.5px] bg-[#c7a27c]/30 mt-1.5 sm:mt-2" />
                </div>

                {/* Guest Dedication */}
                <div className="flex flex-col items-center w-full px-2">
                  <p 
                    className="text-[9px] sm:text-[11px] uppercase tracking-[2px] sm:tracking-[3px] text-[#8a8178] mb-1 sm:mb-2.5"
                    style={{ fontFamily: "var(--font-elegant)" }}
                  >
                    {isPlural ? "Invitación especial para ustedes:" : "Invitación especial para ti:"}
                  </p>
                  
                  {/* Dynamically Sized Guest Name */}
                  <h3 
                    className="text-lg sm:text-2xl text-[#3A2A23] leading-tight font-medium my-0.5 max-w-[280px] break-words"
                    style={{ 
                      fontFamily: "var(--font-pinyon)",
                      textShadow: "0.5px 0.5px 1px rgba(0,0,0,0.01)"
                    }}
                  >
                    {guestName || "Invitado Especial"}
                  </h3>
                </div>

                {/* Button inside invitation */}
                <div className="flex flex-col items-center z-[5] w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevealAll();
                    }}
                    style={{ fontFamily: "var(--font-elegant)" }}
                    className="button button-dark cursor-pointer text-[8px] sm:text-[10px] uppercase tracking-[2px] sm:tracking-[3px] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full hover:bg-[#3A2A23]/90 hover:scale-105 active:scale-95 transition-all duration-300 w-fit select-none bg-[#3A2A23] text-white border-none shadow-[0_4px_10px_rgba(58,42,35,0.15)]"
                  >
                    Abrir Invitación
                  </button>
                </div>
              </div>

              {/* 2. ENVELOPE BASE / BACK GROUND */}
              <div 
                style={{
                  background: "#fdfbfa",
                  border: "1px solid #e5dfd6",
                  borderRadius: "6px",
                  boxShadow: "0 10px 40px rgba(58, 42, 35, 0.08)"
                }}
                className="absolute inset-0 z-[1] overflow-hidden"
              >
                {/* Pocket Inner Shadow detail */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#f5eee4]/20 to-transparent pointer-events-none" />
              </div>

              {/* 3. ENVELOPE FLAP (Top Triangle, Rotates 180 degrees in 3D) */}
              <div
                onClick={handleOpenEnvelope}
                style={{
                  position: "absolute",
                  top: "0",
                  left: "-0.5px",
                  right: "-0.5px",
                  height: "100%",
                  transformOrigin: "top",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: isOpened ? 1 : 5, // Move behind card when fully opened
                  cursor: !isOpened ? "pointer" : "default",
                }}
                className={`envelope-flap ${isOpened ? "opened" : ""}`}
              >
                {/* The Triangle (Front/Outer flap face) - Meets at exact mathematical 50% 50% center */}
                <div 
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#f4ede3",
                    clipPath: "polygon(0 0, 100% 0, 50% 50%)",
                    boxShadow: "0 4px 10px rgba(58, 42, 35, 0.04)",
                    borderTop: "1px solid #e5dfd6",
                    backfaceVisibility: "hidden"
                  }}
                  className="absolute inset-0"
                />
                {/* The Triangle Inner Side (Revealed when flipped open) */}
                <div 
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "#ece4d8",
                    clipPath: "polygon(0 0, 100% 0, 50% 50%)",
                    transform: "rotateX(180deg)",
                    backfaceVisibility: "hidden"
                  }}
                  className="absolute inset-0"
                />
              </div>

              {/* 4. ENVELOPE FRONT COVER POCKET (Left, Right, Bottom decorative triangles meeting at dead center 50% 50%) */}
              <div 
                style={{ clipPath: "polygon(0 0, 0 100%, 50% 50%)", background: "#f8f3eb" }} 
                className="absolute inset-0 z-[3] rounded-b-[6px] border-b border-l border-[#e5dfd6]/60" 
              />
              <div 
                style={{ clipPath: "polygon(100% 0, 50% 50%, 100% 100%)", background: "#f8f3eb" }} 
                className="absolute inset-0 z-[3] rounded-b-[6px] border-b border-r border-[#e5dfd6]/60" 
              />
              <div 
                style={{ clipPath: "polygon(0 100%, 50% 50%, 100% 100%)", background: "#fbf6ef" }} 
                className="absolute inset-0 z-[4] rounded-b-[6px] border-b border-[#e5dfd6]/70 shadow-[0_-5px_15px_rgba(58,42,35,0.02)]" 
              />

              {/* 5. INTERACTIVE WAX SEAL (Centered at exactly 50% 50% - Responsive Size) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEnvelope();
                }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: isOpened 
                    ? "translate(-50%, -50%) scale(0.85) rotate(-10deg) translateY(120px)" 
                    : "translate(-50%, -50%) scale(1) rotate(0deg)",
                  opacity: isOpened ? 0 : 1,
                  pointerEvents: isOpened ? "none" : "auto",
                  transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease",
                  zIndex: 6,
                  cursor: !isOpened ? "pointer" : "default"
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center select-none"
              >
                {/* Metallic Wax Scented Circle */}
                <div 
                  style={{
                    background: "radial-gradient(circle, #e9c393 0%, #b89263 70%, #906c3a 100%)",
                    boxShadow: "0 5px 15px rgba(58, 42, 35, 0.25), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)",
                    border: "2px solid #a87e4c"
                  }}
                  className="absolute inset-0 rounded-full flex items-center justify-center animate-pulse-subtle"
                >
                  {/* Wax seal outer organic ripple */}
                  <div className="absolute inset-[4px] border border-[#a87e4c]/30 rounded-full pointer-events-none" />
                  
                  {/* Monogram Image (using footer2.png in contrast color - Responsive size) */}
                  <div style={{ position: "relative" }} className="w-12 h-11.5 sm:w-[70px] sm:h-[67px]">
                    <Image
                      src="/footer2.png"
                      alt="Monograma Luis & Ailyn"
                      fill
                      className="object-contain"
                      style={{ filter: "brightness(0) invert(1)" }}
                      priority
                    />
                  </div>
                </div>
              </div>

            </div> {/* Envelope Box */}
          </div> {/* Scale Wrapper */}
        </div> {/* Envelope Stage */}

        {/* Footer Text */}
        <p
          className={`text-[10px] text-[#8a8178] uppercase tracking-[3px] mt-6 transition-all duration-700 ${
            isOpened ? "opacity-0 translate-y-[20px] pointer-events-none" : "opacity-100"
          }`}
          style={{ fontFamily: "var(--font-elegant)" }}
        >
          12 DE DICIEMBRE DE 2026
        </p>

      </div>

      <style jsx global>{`
        .opened {
          transform: rotateX(180deg);
        }
        .envelope-scale-wrapper {
          transform-origin: center;
          transition: transform 0.5s ease;
        }
        @media (max-width: 480px) {
          .envelope-scale-wrapper {
            transform: scale(0.9);
          }
        }
        @media (max-width: 400px) {
          .envelope-scale-wrapper {
            transform: scale(0.82);
          }
        }
        @media (max-width: 360px) {
          .envelope-scale-wrapper {
            transform: scale(0.75);
          }
        }
        @media (max-width: 320px) {
          .envelope-scale-wrapper {
            transform: scale(0.68);
          }
        }
        @keyframes pulse-subtle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
