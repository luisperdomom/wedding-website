"use client";

interface Petal {
  id: number;
  left: number; // Percentage (0-100)
  size: number; // Width/Height in px
  delay: number; // Negative delay so some start midway
  duration: number; // Falling speed in seconds
  swayDuration: number; // Side-to-side sway speed
}

export default function GoldenPetals() {
  // Deterministic values prevent a server/client hydration mismatch while
  // preserving the organic distribution.
  const petals: Petal[] = Array.from({ length: 22 }, (_, i) => {
    const variation = (seed: number) => ((i + 1) * seed * 37) % 101 / 100;
    return {
      id: i,
      left: variation(3) * 100,
      size: variation(5) * 8 + 6,
      delay: variation(7) * -25,
      duration: variation(11) * 15 + 15,
      swayDuration: variation(13) * 3 + 3,
    };
  });

  return (
    <div className="fixed inset-0 pointer-events-none z-[15] overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            animation: `fall ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            willChange: "transform",
          }}
        >
          <span
            className="block bg-gradient-to-br from-[#C7A27C]/35 to-[#F5F1EA]/15 rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size * 0.7}px`, // Oval leaf/petal shape
              animation: `sway ${p.swayDuration}s ease-in-out infinite alternate`,
              filter: "blur(0.5px)",
              willChange: "transform",
            }}
          />
        </span>
      ))}

      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(105vh);
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
