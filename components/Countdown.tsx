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

  const [showDropdown, setShowDropdown] = useState(false);

  const eventTitle = "Boda Luis & Ailyn";
  const eventDetails = "Acompáñanos a celebrar nuestra boda en Rancho La Vereda, San José de Ocoa. ¡Te esperamos!";
  const eventLocation = "Rancho La Vereda, San José de Ocoa, República Dominicana";
  const startDate = "20261212T160000"; // 12 de Dic, 2026 a las 16:00
  const endDate = "20261213T020000";   // Termina a las 02:00 del día siguiente

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    eventTitle
  )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
    eventDetails
  )}&location=${encodeURIComponent(eventLocation)}`;

  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(
    eventTitle
  )}&startdt=2026-12-12T16:00:00&enddt=2026-12-13T02:00:00&body=${encodeURIComponent(
    eventDetails
  )}&location=${encodeURIComponent(eventLocation)}`;

  const handleDownloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${eventTitle}
DESCRIPTION:${eventDetails}
LOCATION:${eventLocation}
DTSTART;TZID=America/Santo_Domingo:20261212T160000
DTEND;TZID=America/Santo_Domingo:20261213T020000
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "boda_luis_y_ailyn.ics";
    link.click();
    setShowDropdown(false);
  };

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

      {/* BOTÓN INTELIGENTE "AÑADIR AL CALENDARIO" */}
      <div className="relative mt-12 flex flex-col items-center z-20">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            fontFamily: "var(--font-elegant)",
            border: "1px solid rgba(199, 162, 124, 0.4)",
            background: "rgba(255, 255, 255, 0.02)",
            color: "#e5dcd3",
            cursor: "pointer",
            letterSpacing: "2.5px",
            fontSize: "12px",
            padding: "12px 30px",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease",
          }}
          className="hover:bg-white/5 hover:border-[#c7a27c] hover:scale-103 active:scale-98 select-none"
        >
          {/* Calendar SVG Icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          AÑADIR AL CALENDARIO
        </button>

        {/* Menu Desplegable */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              marginTop: "12px",
              background: "#1e140f",
              border: "1px solid rgba(199, 162, 124, 0.35)",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              width: "210px",
              overflow: "hidden",
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowDropdown(false)}
              style={{
                fontFamily: "var(--font-elegant)",
                letterSpacing: "1.5px",
                fontSize: "11px",
                color: "#e5dcd3",
                padding: "14px 20px",
                textAlign: "left",
                borderBottom: "1px solid rgba(199, 162, 124, 0.15)",
                transition: "background 0.2s ease"
              }}
              className="hover:bg-white/5 block"
            >
              Google Calendar
            </a>
            <button
              onClick={handleDownloadICS}
              style={{
                fontFamily: "var(--font-elegant)",
                letterSpacing: "1.5px",
                fontSize: "11px",
                color: "#e5dcd3",
                padding: "14px 20px",
                textAlign: "left",
                borderBottom: "1px solid rgba(199, 162, 124, 0.15)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                transition: "background 0.2s ease"
              }}
              className="hover:bg-white/5 block"
            >
              Apple Calendar (.ics)
            </button>
            <a
              href={outlookUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowDropdown(false)}
              style={{
                fontFamily: "var(--font-elegant)",
                letterSpacing: "1.5px",
                fontSize: "11px",
                color: "#e5dcd3",
                padding: "14px 20px",
                textAlign: "left",
                transition: "background 0.2s ease"
              }}
              className="hover:bg-white/5 block"
            >
              Outlook / Office 365
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
