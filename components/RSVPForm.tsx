"use client";

import { useState } from "react";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

interface RSVPFormProps {
  guestId: string | null;
  guestName: string | null;
  isValidGuest: boolean | null; // null means loading verification
  alreadyAnswered: boolean;
  setAlreadyAnswered: (val: boolean) => void;
}

export default function RSVPForm({
  guestId,
  guestName,
  isValidGuest,
  alreadyAnswered,
  setAlreadyAnswered,
}: RSVPFormProps) {
  const [attending, setAttending] = useState("Sí asistiré");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (alreadyAnswered) {
      alert("Ya hemos recibido tu confirmación.");
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
    <section id="rsvp" className="section-light !py-24" style={{ textAlign: "center" }}>
      <div className="divider"></div>

      <h2 
        className="tracking-[6px] font-light uppercase text-[clamp(26px,5vw,40px)] mb-5 text-[#3b2b20]"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Confirmar asistencia
      </h2>

      <p 
        className="mb-8 tracking-[0.3px] text-base text-[#8a8178] max-w-[500px] mx-auto leading-relaxed px-4"
        style={{ fontFamily: "var(--font-elegant)" }}
      >
        Invitación personal e intransferible.
        Debido a la capacidad del evento, no será posible incluir acompañantes adicionales.
      </p>

      <div className="max-w-[420px] mx-auto px-4">
        {!isValidGuest ? (
          <p 
            className="mb-8 tracking-[0.3px] text-base text-[#8a8178] leading-relaxed"
            style={{ fontFamily: "var(--font-elegant)" }}
          >
            Esta invitación es personal.<br />
            Por favor utiliza el enlace que recibiste para confirmar tu asistencia.
          </p>
        ) : alreadyAnswered || submitted ? (
          <div className="bg-white/50 border border-[#e5e0d8] p-8 rounded-lg shadow-sm">
            <p 
              className="tracking-[0.3px] text-xl text-[#3b2b20] font-light"
              style={{ fontFamily: "var(--font-elegant)" }}
            >
              Ya hemos recibido tu confirmación.<br />
              ¡Muchas gracias! 💛
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 text-left"
          >
            <div className="flex flex-col gap-1.5">
              <label 
                className="text-xs text-[#8a8178] tracking-[1px] uppercase font-medium"
                style={{ fontFamily: "var(--font-elegant)" }}
              >
                ¿Asistirás al evento?
              </label>
              <select
                value={attending}
                onChange={(e) => setAttending(e.target.value)}
                className="w-full p-3.5 rounded-lg border border-[#e5e0d8] bg-white text-sm outline-none focus:border-[#C7A27C] transition-all text-[#3b2b20]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="Sí asistiré">Sí asistiré</option>
                <option value="No podré asistir">No podré asistir</option>
              </select>
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
              disabled={loading}
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
