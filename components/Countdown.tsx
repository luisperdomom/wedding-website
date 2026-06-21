"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO string or date format, e.g. "2026-12-12T16:00:00"
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, "0");
  };

  useEffect(() => {
    const weddingDateTime = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = weddingDateTime - now;

      if (distance < 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({
        days: formatNumber(days),
        hours: formatNumber(hours),
        minutes: formatNumber(minutes),
        seconds: formatNumber(seconds),
      });
    };

    calculateTimeLeft(); // Run immediately
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const labels = ["DÍAS", "HORAS", "MIN", "SEG"];
  const values = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds];

  return (
    <section className="section-dark">
      <h2 
        className="font-elegant tracking-[6px] font-light uppercase text-[clamp(24px,4vw,42px)] mb-7"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Nuestro para siempre comienza en
      </h2>

      <div className="flex justify-center flex-wrap gap-5 mt-10">
        {values.map((val, index) => (
          <div
            key={index}
            className="min-w-[100px] p-5 border border-white/15 rounded-lg bg-white/3"
          >
            <div 
              className="text-[clamp(30px,6vw,50px)] font-light"
              style={{ fontFamily: "var(--font-elegant)" }}
            >
              {val}
            </div>
            <p 
              className="mt-2.5 tracking-[3px] text-[11px] opacity-70"
              style={{ fontFamily: "var(--font-elegant)" }}
            >
              {labels[index]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
