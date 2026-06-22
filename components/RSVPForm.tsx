"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

interface RSVPFormProps {
  guestId: string | null;
  guestName: string | null;
  isValidGuest: boolean | null; // null means loading verification
  alreadyAnswered: boolean;
  setAlreadyAnswered: (val: boolean) => void;
  isExpired: boolean; // 7-day rolling expiration state
  attendingChoice: string | null; // Load existing selection dynamically
  isPlural: boolean;
  primaryName: string;
  companionName: string;
}

export default function RSVPForm({
  guestId,
  guestName,
  isValidGuest,
  alreadyAnswered,
  setAlreadyAnswered,
  isExpired,
  attendingChoice,
  isPlural,
  primaryName,
  companionName,
}: RSVPFormProps) {
  const [attending, setAttending] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form default values based on whether they have a companion or not
  useEffect(() => {
    if (isPlural) {
      setAttending("Ambos asistiremos");
    } else {
      setAttending("Sí asistiré");
    }
  }, [isPlural]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (alreadyAnswered) {
      alert("Ya hemos recibido tu confirmación.");
      return;
    }

    if (isExpired) {
      alert("El período de confirmación ha concluido.");
      return;
    }

    if (!guestId || !guestName) {
      alert("Error: No se pudo identificar al invitado.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "rsvp"), {
        guestId,
        guestName,
        attending,
        message: message.trim(),
        created: new Date(),
      });

      setSubmitted(true);
      setAlreadyAnswered(true);
    } catch (error) {
      console.error("Error al registrar RSVP:", error);
      alert("Ocurrió un error al guardar tu confirmación. Por favor inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Determine what the user answered (either the newly submitted value or the loaded DB value)
  const finalChoice = submitted ? attending : attendingChoice;

  // Helper to determine if they are attending or not based on their choice string
  const isAttendingSelection = (choice: string | null) => {
    if (!choice) return false;
    return choice === "Sí asistiré" || choice === "Ambos asistiremos" || choice.startsWith("Solo asistirá");
  };

  if (isValidGuest === null) {
    return (
      <section id="rsvp" className="section-light !py-24" style={{ textAlign: "center" }}>
        <div className="divider"></div>
        <p className="text-[#8a8178] animate-pulse" style={{ fontFamily: "var(--font-elegant)" }}>
          Verificando tu invitación...
        </p>
      </section>
    );
  }

  return (
    <section id="rsvp" className="section-light !py-24" style={{ textAlign: "center", position: "relative" }}>
      <div className="divider"></div>

      <h2 
        className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Confirmar asistencia
      </h2>

      <p 
        className="mb-10 tracking-[0.3px] text-[18px] text-[#8a8178] max-w-[650px] mx-auto leading-relaxed px-4"
        style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
      >
        {isPlural ? (
          `Nos encantaría contar con su presencia en este día tan especial para nosotros. Por favor, confírmennos su asistencia dentro de la validez de su invitación.`
        ) : (
          `Nos encantaría contar con tu presencia en este día tan especial para nosotros. Por favor, confírmanos tu asistencia dentro de la validez de tu invitación.`
        )}
      </p>

      {/* TARJETA DE FORMULARIO DE LUJO (STATIONERY CARD) */}
      <div 
        style={{
          maxWidth: "460px",
          margin: "0 auto",
          background: "white",
          padding: "50px 30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(58, 42, 35, 0.03)",
          border: "1px solid rgba(199, 162, 124, 0.2)",
          position: "relative",
          overflow: "hidden"
        }}
        className="px-4"
        data-aos="fade-up"
      >
        {/* Inset Border Frame */}
        <div style={{
          position: "absolute",
          inset: "8px",
          border: "1px solid rgba(199, 162, 124, 0.1)",
          borderRadius: "10px",
          pointerEvents: "none"
        }} />

        {!isValidGuest ? (
          <div style={{ zIndex: 10, position: "relative" }}>
            <p 
              className="tracking-[0.3px] text-sm text-[#8a8178] leading-relaxed"
              style={{ fontFamily: "var(--font-elegant)" }}
            >
              Esta invitación es personal e intransferible.<br /><br />
              Por favor utiliza el enlace que recibiste para confirmar tu asistencia.
            </p>
          </div>
        ) : alreadyAnswered || submitted ? (
          <div style={{ zIndex: 10, position: "relative" }} className="flex flex-col items-center">
            {isAttendingSelection(finalChoice) ? (
              /* MENSAJE SÍ ASISTIRÁ(N) */
              <>
                {/* Elegant Gold Heart SVG */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "18px" }}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" style={{ fill: "rgba(199,162,124,0.08)" }} />
                </svg>
                <p 
                  className="tracking-[0.3px] text-base text-[#3b2b20] leading-relaxed font-light"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {isPlural ? (
                    <>
                      ¡Muchas gracias por su confirmación!<br /><br />
                      Hemos recibido su respuesta con mucha alegría. Nos hace inmensamente felices saber que compartirán este día tan especial con nosotros.
                    </>
                  ) : (
                    <>
                      ¡Muchas gracias por tu confirmación!<br /><br />
                      Hemos recibido tu respuesta con mucha alegría. Nos hace inmensamente felices saber que compartirás este día tan especial con nosotros.
                    </>
                  )}
                </p>
              </>
            ) : (
              /* MENSAJE NO ASISTIRÁ(N) */
              <>
                {/* Soft Gold Sad Face SVG */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "18px" }}>
                  <circle cx="12" cy="12" r="10" style={{ fill: "rgba(199,162,124,0.03)" }} />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
                  <path d="M16 16a4 4 0 0 0-8 0" />
                </svg>
                <p 
                  className="tracking-[0.3px] text-base text-[#3b2b20] leading-relaxed font-light"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {isPlural ? (
                    <>
                      Muchas gracias por su sinceridad.<br /><br />
                      Lamentamos mucho que no puedan acompañarnos física o presencialmente, pero valoramos inmensamente sus buenos deseos y sabemos que nos acompañarán con el corazón.
                    </>
                  ) : (
                    <>
                      Muchas gracias por tu sinceridad.<br /><br />
                      Lamentamos mucho que no puedas acompañarnos física o presencialmente, pero valoramos inmensamente tus buenos deseos y sabemos que nos acompañarás con el corazón.
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        ) : isExpired ? (
          <div style={{ zIndex: 10, position: "relative" }} className="flex flex-col items-center">
            {/* Elegant Padlock SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c7a27c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "18px" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p 
              className="tracking-[0.3px] text-sm text-[#8a8178] leading-relaxed"
              style={{ fontFamily: "var(--font-body)", lineHeight: "1.7" }}
            >
              Esta invitación ha expirado.<br /><br />
              El período de 7 días para confirmar tu asistencia ha concluido. Lamentablemente, debido a los tiempos de planificación y capacidad limitada de Rancho La Vereda, ya no es posible registrar nuevas confirmaciones.<br /><br />
              ¡Gracias por tus buenos deseos! Te extrañaremos en nuestro gran día.<br /><br />
              <strong style={{ color: "#3b2b20" }}>Luis & Ailyn</strong>
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-left z-10 relative"
          >
            <div className="flex flex-col gap-1.5">
              <label 
                className="text-xs text-[#8a8178] tracking-[1px] uppercase font-medium"
                style={{ fontFamily: "var(--font-elegant)" }}
              >
                {isPlural ? "¿Asistirán al evento?" : "¿Asistirás al evento?"}
              </label>
              
              {isPlural ? (
                /* DROPDOWN PLURAL (CON OPCIONES INDIVIDUALES DE ASISTENCIA) */
                <select
                  value={attending}
                  onChange={(e) => setAttending(e.target.value)}
                  className="w-full p-3.5 rounded-lg border border-[#e5e0d8] bg-white text-sm outline-none focus:border-[#C7A27C] transition-all text-[#3b2b20]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <option value="Ambos asistiremos">Ambos asistiremos</option>
                  <option value={`Solo asistirá ${primaryName}`}>Solo asistirá {primaryName}</option>
                  <option value={`Solo asistirá ${companionName}`}>Solo asistirá {companionName}</option>
                  <option value="Ninguno asistirá">Ninguno asistirá</option>
                </select>
              ) : (
                /* DROPDOWN SINGULAR ESTÁNDAR */
                <select
                  value={attending}
                  onChange={(e) => setAttending(e.target.value)}
                  className="w-full p-3.5 rounded-lg border border-[#e5e0d8] bg-white text-sm outline-none focus:border-[#C7A27C] transition-all text-[#3b2b20]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <option value="Sí asistiré">Sí asistiré</option>
                  <option value="No podré asistir">No podré asistir</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label 
                className="text-xs text-[#8a8178] tracking-[1px] uppercase font-medium"
                style={{ fontFamily: "var(--font-elegant)" }}
              >
                Mensaje de felicitación para los novios (Opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe aquí un mensaje especial..."
                rows={4}
                className="w-full p-3.5 rounded-lg border border-[#e5e0d8] bg-white text-sm outline-none focus:border-[#C7A27C] transition-all text-[#3b2b20] resize-none"
                style={{ fontFamily: "var(--font-body)" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !attending}
              className="button button-dark cursor-pointer text-xs uppercase tracking-[2px] py-4 rounded-full mt-2 w-full hover:opacity-90 transition-all disabled:opacity-50"
              style={{ fontFamily: "var(--font-elegant)" }}
            >
              {loading ? "Enviando..." : "Confirmar asistencia"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
