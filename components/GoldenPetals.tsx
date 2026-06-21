"use client";

import { useEffect, useState } from "react";

interface Petal {
  id: number;
  left: number; // Percentage (0-100)
  size: number; // Width/Height in px
  delay: number; // Negative delay so some start midway
  duration: number; // Falling speed in seconds
  swayDuration: number; // Side-to-side sway speed
}

export default function GoldenPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    // Generate 22 randomized golden petals (a nod to their 22 pre-wedding photos!)
    const items = Array.from({ length: 22 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 8 + 6, // 6px to 14px size
      delay: Math.random() * -25, // Start immediately in various states of fall
      duration: Math.random() * 15 + 15, // Very slow, floaty fall (15s to 30s)
      swayDuration: Math.random() * 3 + 3, // 3s to 6s sway duration
    }));
    setPetals(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[15] overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute bg-gradient-to-br from-[#C7A27C]/35 to-[#F5F1EA]/15 rounded-full"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.7}px`, // Oval leaf/petal shape
            top: "-10px",
            animation: `fall ${p.duration}s linear infinite, sway ${p.swayDuration}s ease-in-out infinite alternate`,
            animationDelay: `${p.delay}s, 0s`,
            filter: "blur(0.5px)",
          }}
        />
      ))}

      <style jsx global>{`
        @keyframes fall {
          0% {
            top: -5%;
          }
          100% {
            top: 105%;
          }
        }
        @keyframes sway {
          0% {
            transform: translateX(-20px) rotate(0deg) scaleX(1);
          }
          50% {
            transform: translateX(0px) rotate(180deg) scaleX(0.7);
          }
          100% {
            transform: translateX(20px) rotate(360deg) scaleX(1);
          }
        }
      `}</style>
    </div>
  );
}
