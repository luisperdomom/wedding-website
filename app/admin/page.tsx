"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

// Interface Definitions
interface RSVPResponse {
  guestId: string;
  guestName: string;
  name?: string; // Soporte para registros antiguos de prueba
  attending: string;
  message?: string;
  created: any;
}

interface Guest {
  id: string;
  name: string;
  token: string;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorErrorMsg] = useState("");

  // Dashboard Data State
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeTab, setActiveTab] = useState<"rsvps" | "guests">("rsvps");
  const [loading, setLoading] = useState(true);

  // New Guest Form State
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestId, setNewGuestId] = useState("");
  const [newGuestToken, setNewGuestToken] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  
  // Feedback states
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Secret admin password configuration (supports env variable, defaults to "boda2026")
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "boda2026";

  // Check auth session on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem("wedding_admin_auth") === "true";
    setIsAuthenticated(isAuth);
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      setLoading(true);
      try {
        // Load RSVPs
        const rsvpSnap = await getDocs(collection(db, "rsvp"));
        const rsvpData: RSVPResponse[] = [];
        rsvpSnap.forEach((d) => {
          rsvpData.push({ id: d.id, ...d.data() } as any);
        });
        setRsvps(rsvpData);

        // Load Guests
        const guestSnap = await getDocs(collection(db, "guests"));
        const guestData: Guest[] = [];
        guestSnap.forEach((d) => {
          guestData.push({ id: d.id, ...d.data() } as Guest);
        });
        setGuests(guestData);
      } catch (err) {
        console.error("Error cargando datos de Firebase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  // Handle auto-generation of ID and Token in form
  useEffect(() => {
    if (!newGuestName) {
      setNewGuestId("");
      setNewGuestToken("");
      return;
    }

    // Convert name to dynamic guestId slug (kebab-case)
    const slug = newGuestName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-");

    // Generate random 6 character uppercase token
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // clear alphanumerics
    let tokenGen = "";
    for (let i = 0; i < 6; i++) {
      tokenGen += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    setNewGuestId(slug);
    setNewGuestToken(tokenGen);
  }, [newGuestName]);

  // Authenticate Admin
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("wedding_admin_auth", "true");
      setIsAuthenticated(true);
      setErrorErrorMsg("");
    } else {
      setErrorErrorMsg("Contraseña incorrecta. Por favor inténtalo de nuevo.");
    }
  };

  // Logout Admin
  const handleLogout = () => {
    sessionStorage.removeItem("wedding_admin_auth");
    setIsAuthenticated(false);
    setPassword("");
  };

  // Add new guest to Firestore
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName || !newGuestId || !newGuestToken) return;

    setAddingGuest(true);
    try {
      const guestRef = doc(db, "guests", newGuestId);
      await setDoc(guestRef, {
        name: newGuestName,
        token: newGuestToken,
      });

      // Update local state
      const newlyAdded: Guest = {
        id: newGuestId,
        name: newGuestName,
        token: newGuestToken,
      };
      setGuests((prev) => [newlyAdded, ...prev]);

      // Reset form
      setNewGuestName("");
      setNewGuestId("");
      setNewGuestToken("");
    } catch (err) {
      console.error("Error al guardar invitado:", err);
      alert("Error al añadir invitado a la base de datos.");
    } finally {
      setAddingGuest(false);
    }
  };

  // Delete guest from Firestore
  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esto anulará su enlace de acceso.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "guests", id));
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Error al eliminar invitado:", err);
      alert("Error al eliminar el invitado.");
    }
  };

  // Copy personalized link to Clipboard
  const handleCopyLink = (guest: Guest, index: number) => {
    const baseUrl = window.location.origin;
    const personalUrl = `${baseUrl}/?guest=${guest.id}&token=${guest.token}`;

    navigator.clipboard.writeText(personalUrl).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Export RSVP entries to CSV
  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      alert("No hay confirmaciones registradas para exportar.");
      return;
    }

    const headers = ["Nombre", "Asistencia", "Mensaje", "Fecha de Confirmación"];
    
    // Safely map rsvps properties, handling undefined/null elements
    const rows = rsvps.map((r) => {
      let dateStr = "";
      try {
        if (r.created) {
          if (r.created.toDate) {
            dateStr = r.created.toDate().toLocaleString();
          } else {
            dateStr = new Date(r.created).toLocaleString();
          }
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }

      return [
        r.guestName || r.name || "",
        r.attending || "",
        r.message || "",
        dateStr
      ];
    });

    // Construct TSV content (Tab Separated Values) encoded in UTF-16LE.
    // This is the gold standard for Excel double-click compatibility on Mac (Darwin) and Windows.
    // It guarantees columns separate correctly and accents display flawlessly.
    const tsvContent = [
      headers.join("\t"),
      ...rows.map((row) => 
        row.map((val) => {
          const stringVal = val === null || val === undefined ? "" : String(val);
          // Clean tabs and newlines to prevent row/column break in Excel
          return stringVal.replace(/\t/g, " ").replace(/\r?\n/g, " ");
        }).join("\t")
      )
    ].join("\r\n");

    // Convert string to UTF-16LE ArrayBuffer
    const buffer = new ArrayBuffer(tsvContent.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < tsvContent.length; i++) {
      view.setUint16(i * 2, tsvContent.charCodeAt(i), true); // true = Little Endian
    }

    // Prepend UTF-16LE BOM: 0xFF, 0xFE
    const bom = new Uint8Array([0xFF, 0xFE]);
    const blob = new Blob([bom, buffer], { type: "text/csv;charset=utf-16le;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `confirmaciones_boda_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up memory
  };

  // Render Loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F1EA]">
        <p className="text-[#3A2A23] font-light animate-pulse text-lg">Iniciando panel...</p>
      </div>
    );
  }

  // Render Login Form if unauthorized
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F1EA] px-4">
        <div className="w-full max-w-md bg-white border border-[#e5e0d8] p-8 rounded-2xl shadow-[0_10px_35px_rgba(58,42,35,0.06)]">
          <h1 className="text-3xl text-center text-[#3A2A23] font-light tracking-[2px] mb-2 uppercase">
            Panel de Acceso
          </h1>
          <p className="text-center text-[#8a8178] text-sm mb-6">
            Introduce la contraseña de administración para acceder.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 rounded-xl border border-[#e5e0d8] bg-[#FAF8F5] text-[#3A2A23] text-sm outline-none focus:border-[#C7A27C] transition-all"
              required
            />
            {errorMsg && <p className="text-red-500 text-xs text-center">{errorMsg}</p>}
            <button
              type="submit"
              className="bg-[#3A2A23] hover:bg-[#4E3B33] text-white text-xs uppercase tracking-[2px] font-semibold py-4 rounded-xl transition-all cursor-pointer"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Statistics calculations
  const totalRSVPs = rsvps.length;
  const attendingCount = rsvps.filter((r) => r.attending === "Sí asistiré").length;
  const notAttendingCount = rsvps.filter((r) => r.attending === "No podré asistir").length;
  const totalGuestsInDB = guests.length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#3A2A23] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e0d8] px-6 py-4 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💍</span>
          <h1 className="text-xl font-light tracking-[2px] uppercase">
            Luis & Ailyn <span className="text-[#C7A27C] font-semibold">| Admin</span>
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs uppercase tracking-[1px] border border-[#e5e0d8] hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-[#8a8178] px-4 py-2.5 rounded-lg transition-all cursor-pointer"
        >
          Cerrar Sesión
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
            <span className="text-xs tracking-[1.5px] uppercase font-bold text-[#8a8178]">Confirmados</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-light text-[#7A8468]">{attendingCount}</span>
              <span className="text-xs text-[#8a8178]">personas</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
            <span className="text-xs tracking-[1.5px] uppercase font-bold text-[#8a8178]">No Asistirán</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-light text-red-500">{notAttendingCount}</span>
              <span className="text-xs text-[#8a8178]">personas</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
            <span className="text-xs tracking-[1.5px] uppercase font-bold text-[#8a8178]">Respuestas</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-light text-[#C7A27C]">{totalRSVPs}</span>
              <span className="text-xs text-[#8a8178]">recibidas</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#e5e0d8] shadow-sm flex flex-col justify-between">
            <span className="text-xs tracking-[1.5px] uppercase font-bold text-[#8a8178]">Invitados</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-light text-[#3A2A23]">{totalGuestsInDB}</span>
              <span className="text-xs text-[#8a8178]">en el sistema</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-10 border-b border-[#e5e0d8] pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("rsvps")}
              className={`px-5 py-2.5 rounded-lg text-sm tracking-[1px] font-medium transition-all cursor-pointer ${
                activeTab === "rsvps"
                  ? "bg-[#3A2A23] text-white"
                  : "text-[#8a8178] hover:text-[#3A2A23] hover:bg-white border border-transparent"
              }`}
            >
              Confirmaciones RSVP ({totalRSVPs})
            </button>
            <button
              onClick={() => setActiveTab("guests")}
              className={`px-5 py-2.5 rounded-lg text-sm tracking-[1px] font-medium transition-all cursor-pointer ${
                activeTab === "guests"
                  ? "bg-[#3A2A23] text-white"
                  : "text-[#8a8178] hover:text-[#3A2A23] hover:bg-white border border-transparent"
              }`}
            >
              Lista de Invitados ({totalGuestsInDB})
            </button>
          </div>

          {activeTab === "rsvps" && (
            <button
              onClick={handleExportCSV}
              className="bg-[#7A8468] hover:bg-[#6A7458] text-white text-xs uppercase tracking-[1px] font-bold px-4 py-3 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              📥 Exportar Excel (CSV)
            </button>
          )}
        </div>

        {/* Tab 1: RSVP List */}
        {activeTab === "rsvps" && (
          <div className="bg-white border border-[#e5e0d8] rounded-2xl mt-6 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-[#8a8178] animate-pulse text-sm">Cargando confirmaciones...</div>
            ) : rsvps.length === 0 ? (
              <div className="p-12 text-center text-[#8a8178] text-sm">Ningún invitado ha confirmado todavía.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#e5e0d8] text-xs uppercase tracking-[1px] text-[#8a8178]">
                      <th className="px-6 py-4.5 font-bold">Invitado</th>
                      <th className="px-6 py-4.5 font-bold">Asistencia</th>
                      <th className="px-6 py-4.5 font-bold">Mensaje de Felicitación</th>
                      <th className="px-6 py-4.5 font-bold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebd8]/50 text-sm">
                    {rsvps.map((r, i) => (
                      <tr key={i} className="hover:bg-[#FAF8F5]/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#3A2A23]">{r.guestName || r.name || "Invitado sin nombre"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              r.attending === "Sí asistiré"
                                ? "bg-[#e2f0d9] text-[#4d713c]"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {r.attending}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#8a8178] italic max-w-md truncate" title={r.message}>
                          {r.message ? `"${r.message}"` : <span className="text-gray-300">Ninguno</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#8a8178]">
                          {r.created?.toDate ? r.created.toDate().toLocaleDateString() : new Date(r.created).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Guest List and Form */}
        {activeTab === "guests" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Add Guest Form */}
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm h-fit">
              <h3 className="text-base uppercase tracking-[1.5px] font-bold mb-4 text-[#3A2A23]">
                Añadir Nuevo Invitado
              </h3>

              <form onSubmit={handleAddGuest} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8a8178] uppercase tracking-[0.5px] font-medium">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Familia Gómez Solís"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none focus:border-[#C7A27C] transition-all bg-[#FAF8F5] text-[#3A2A23]"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8a8178] uppercase tracking-[0.5px] font-medium">
                    ID Invitado (Para el enlace)
                  </label>
                  <input
                    type="text"
                    placeholder="Generado automáticamente"
                    value={newGuestId}
                    onChange={(e) => setNewGuestId(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8a8178] uppercase tracking-[0.5px] font-medium">
                    Token de Seguridad
                  </label>
                  <input
                    type="text"
                    placeholder="Generado automáticamente"
                    value={newGuestToken}
                    onChange={(e) => setNewGuestToken(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none bg-gray-50 text-gray-400 cursor-not-allowed"
                    disabled
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingGuest || !newGuestName}
                  className="bg-[#3A2A23] hover:bg-[#4E3B33] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs uppercase tracking-[1.5px] font-bold py-3.5 rounded-lg transition-all mt-2 cursor-pointer"
                >
                  {addingGuest ? "Añadiendo..." : "Añadir Invitado"}
                </button>
              </form>
            </div>

            {/* Guest List Grid */}
            <div className="lg:col-span-2 bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm">
              <h3 className="text-base uppercase tracking-[1.5px] font-bold mb-4 text-[#3A2A23]">
                Invitados Registrados
              </h3>

              {loading ? (
                <div className="p-12 text-center text-[#8a8178] animate-pulse text-sm">Cargando lista...</div>
              ) : guests.length === 0 ? (
                <div className="p-12 text-center text-[#8a8178] text-sm">No hay invitados creados todavía.</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-2">
                  {guests.map((g, index) => (
                    <div
                      key={g.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#FAF8F5] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] hover:border-[#e5e0d8] transition-all gap-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm text-[#3A2A23]">{g.name}</span>
                        <div className="flex items-center gap-3 text-xs text-[#8a8178] mt-0.5">
                          <span>ID: <code className="bg-[#e5e0d8]/30 px-1 py-0.5 rounded text-[10px] font-mono">{g.id}</code></span>
                          <span>Token: <code className="bg-[#e5e0d8]/30 px-1 py-0.5 rounded text-[10px] font-mono">{g.token}</code></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleCopyLink(g, index)}
                          className={`text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                            copiedIndex === index
                              ? "bg-[#e2f0d9] border-[#c0e0cc] text-[#4d713c]"
                              : "bg-white border-[#e5e0d8] hover:border-[#C7A27C] text-[#3A2A23]"
                          }`}
                        >
                          {copiedIndex === index ? "¡Copiado! ✓" : "📋 Copiar Enlace"}
                        </button>

                        <button
                          onClick={() => handleDeleteGuest(g.id, g.name)}
                          className="text-xs border border-transparent hover:border-red-100 bg-white text-red-500 hover:bg-red-50/50 p-2 rounded-lg transition-all cursor-pointer"
                          title="Eliminar invitado"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
