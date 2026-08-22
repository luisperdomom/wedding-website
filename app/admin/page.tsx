"use client";

import { useEffect, useState } from "react";

// Interface Definitions
interface RSVPResponse {
  id: string;
  guestId: string;
  guestName: string;
  name?: string; // Soporte para registros antiguos de prueba
  attending: string;
  message?: string;
  created: string | null;
}

interface Guest {
  id: string;
  name: string;
  token: string;
  createdAt?: string | null;
  phone?: string;
  companion?: string;
  invitationSentAt?: string | null;
  reminderSentAt?: string | null;
}

interface ImportGuestRow {
  row: number;
  name: string;
  phone: string;
  companion: string;
  error?: string;
}

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorErrorMsg] = useState("");

  // Dashboard Data State
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeTab, setActiveTab] = useState<"rsvps" | "guests" | "reminders">("rsvps");
  const [loading, setLoading] = useState(true);

  // New Guest Form State
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestId, setNewGuestId] = useState("");
  const [newGuestToken, setNewGuestToken] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestCompanion, setNewGuestCompanion] = useState("");
  const [addingGuest, setAddingGuest] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<ImportGuestRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importingGuests, setImportingGuests] = useState(false);
  
  // Feedback states
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);

  // Check the signed, httpOnly server session on mount.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        const data = (await response.json()) as { authenticated?: boolean };
        setIsAuthenticated(data.authenticated === true);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkSession();
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (!response.ok) throw new Error("No se pudieron cargar los datos.");
        const data = (await response.json()) as {
          rsvps: RSVPResponse[];
          guests: Guest[];
        };
        setRsvps(data.rsvps);
        setGuests(data.guests);
      } catch (err) {
        console.error("Error cargando datos de Firebase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated]);

  // Show a slug preview. The final unique ID and secure token are generated server-side.
  useEffect(() => {
    if (editingGuestId) return;
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

    setNewGuestId(slug);
    setNewGuestToken("Se generará de forma segura");
  }, [newGuestName, editingGuestId]);

  // Authenticate Admin
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorErrorMsg("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (response.ok) {
        setPassword("");
        setIsAuthenticated(true);
      } else {
        setErrorErrorMsg(data.error || "No se pudo iniciar sesión.");
      }
    } catch {
      setErrorErrorMsg("No se pudo conectar con el servidor.");
    }
  };

  // Logout Admin
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setPassword("");
    setGuests([]);
    setRsvps([]);
  };

  // Add new guest to Firestore
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuestName) return;

    setAddingGuest(true);
    try {
      const endpoint = editingGuestId
        ? `/api/admin/guests/${encodeURIComponent(editingGuestId)}`
        : "/api/admin/guests";
      const response = await fetch(endpoint, {
        method: editingGuestId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingGuestId ? { action: "update-details" } : {}),
          name: newGuestName,
          phone: newGuestPhone,
          companion: newGuestCompanion,
        }),
      });
      const data = (await response.json()) as { guest?: Guest; error?: string };
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok || !data.guest) {
        throw new Error(
          data.error ||
            (editingGuestId
              ? "No se pudo actualizar el invitado."
              : "No se pudo añadir el invitado."),
        );
      }
      setGuests((prev) =>
        editingGuestId
          ? prev.map((guest) =>
              guest.id === editingGuestId
                ? { ...guest, ...data.guest!, id: guest.id, token: guest.token }
                : guest,
            )
          : [data.guest!, ...prev],
      );

      // Reset form
      setNewGuestName("");
      setNewGuestId("");
      setNewGuestToken("");
      setNewGuestPhone("");
      setNewGuestCompanion("");
      setEditingGuestId(null);
    } catch (err) {
      console.error("Error al guardar invitado:", err);
      alert(
        err instanceof Error
          ? err.message
          : editingGuestId
            ? "Error al actualizar invitado."
            : "Error al añadir invitado.",
      );
    } finally {
      setAddingGuest(false);
    }
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setNewGuestName(guest.name);
    setNewGuestId(guest.id);
    setNewGuestToken(guest.token);
    setNewGuestPhone(guest.phone || "");
    setNewGuestCompanion(guest.companion || "");
    window.scrollTo({ top: 430, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingGuestId(null);
    setNewGuestName("");
    setNewGuestId("");
    setNewGuestToken("");
    setNewGuestPhone("");
    setNewGuestCompanion("");
  };

  const normalizeHeader = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const handleDownloadTemplate = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invitados");
    worksheet.columns = [
      { header: "Nombre completo", key: "name", width: 32 },
      { header: "Teléfono", key: "phone", width: 20 },
      { header: "Acompañante", key: "companion", width: 32 },
    ];
    worksheet.addRow({
      name: "Ejemplo: Juan Pérez",
      phone: "8095551234",
      companion: "Ejemplo: María Rodríguez",
    });
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3A2A23" },
    };
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    const output = await workbook.xlsx.writeBuffer();
    const blob = new Blob([new Uint8Array(output)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla_invitados.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportError("");
    setImportRows([]);
    setImportFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportError("Selecciona un archivo de Excel con extensión .xlsx.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError("El archivo no puede superar 5 MB.");
      return;
    }

    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const bytes = new Uint8Array(await file.arrayBuffer());
      await workbook.xlsx.load(bytes as never);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("El archivo no contiene hojas.");

      const headerIndexes = new Map<string, number>();
      worksheet.getRow(1).eachCell((cell, columnNumber) => {
        headerIndexes.set(normalizeHeader(String(cell.text)), columnNumber);
      });
      const nameColumn = headerIndexes.get("nombre completo") ?? headerIndexes.get("nombre");
      const phoneColumn = headerIndexes.get("telefono") ?? headerIndexes.get("celular");
      const companionColumn = headerIndexes.get("acompanante") ?? headerIndexes.get("invitado");
      if (!nameColumn) {
        throw new Error('No encontramos la columna obligatoria "Nombre completo".');
      }

      const rows: ImportGuestRow[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = String(row.getCell(nameColumn).text).trim();
        const phone = phoneColumn ? String(row.getCell(phoneColumn).text).trim() : "";
        const companion = companionColumn
          ? String(row.getCell(companionColumn).text).trim()
          : "";
        if (!name && !phone && !companion) return;
        let error: string | undefined;
        if (!name) error = "Falta el nombre.";
        else if (name.length > 120) error = "El nombre es demasiado largo.";
        else if (phone.length > 30) error = "El teléfono es demasiado largo.";
        else if (companion.length > 120) error = "El acompañante es demasiado largo.";
        rows.push({ row: rowNumber, name, phone, companion, error });
      });
      if (rows.length === 0) throw new Error("El archivo no contiene invitados.");
      if (rows.length > 200) throw new Error("Puedes importar un máximo de 200 invitados a la vez.");
      setImportRows(rows);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "No se pudo leer el archivo.");
    }
  };

  const handleBulkImport = async () => {
    if (importRows.length === 0 || importRows.some((row) => row.error)) return;
    setImportingGuests(true);
    setImportError("");
    try {
      const response = await fetch("/api/admin/guests/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: importRows }),
      });
      const data = (await response.json()) as { guests?: Guest[]; count?: number; error?: string };
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok || !data.guests) {
        throw new Error(data.error || "No se pudieron importar los invitados.");
      }
      setGuests((current) => [...data.guests!, ...current]);
      setImportRows([]);
      setImportFileName("");
      alert(`${data.count || data.guests.length} invitados importados correctamente.`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "No se pudo completar la importación.");
    } finally {
      setImportingGuests(false);
    }
  };

  // Delete guest from Firestore
  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esto anulará su enlace de acceso.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/guests/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error("No se pudo eliminar el invitado.");
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

  // Helper to generate the warm invitation message based on whether they have a companion or not
  const getFullInvitationMessage = (guest: Guest) => {
    const baseUrl = window.location.origin;
    const personalUrl = `${baseUrl}/?guest=${guest.id}&token=${guest.token}`;

    if (guest.companion && guest.companion.trim()) {
      return `¡Hola ${guest.name}! 🤍 Nos hace muchísima ilusión contarles que... ¡nos casamos! 🥂💍\n\nQueremos que sean parte de este día tan especial para nosotros, y nos emociona un montón contar contigo y con ${guest.companion.trim()}. Les compartimos su invitación con todos los detalles aquí:\n\n${personalUrl}\n\n👉 Por favor, asegúrense de deslizar hasta abajo en la página para ver algunas preguntas y respuestas que les pueden servir de ayuda, y para confirmar su asistencia.\n\nNota: Como los cupos de nuestra boda son súper limitados, la invitación es válida únicamente para las personas indicadas. Si no se detalla un acompañante o pase adicional, les pedimos de corazón respetar este límite. ¡Esperamos que nos entiendan! 🤍\n\nRecuerden que tienen un plazo de 7 días a partir de hoy para confirmar su asistencia a través de la web. ¡Ojalá puedan acompañarnos! ✨`;
    } else {
      return `¡Hola ${guest.name}! 🤍 Nos hace muchísima ilusión contarte que... ¡nos casamos! 🥂💍\n\nQueremos de todo corazón que seas parte de este día tan especial para nosotros. Te compartimos tu invitación con todos los detalles aquí:\n\n${personalUrl}\n\n👉 Por favor, asegúrate de deslizar hasta abajo en la página para ver algunas preguntas y respuestas que te pueden servir de ayuda, y para confirmar tu asistencia.\n\nNota: Como los cupos de nuestra boda son súper limitados, la invitación es personal y válida únicamente para ti. Si no se detalla un acompañante o pase adicional, te pedimos de corazón respetar este límite. ¡Esperamos que nos entiendan! 🤍\n\nRecuerda que tienes un plazo de 7 días a partir de hoy para confirmar tu asistencia a través de la web. ¡Ojalá puedas acompañarnos! ✨`;
    }
  };

  // Copy full elegant invitation message to Clipboard
  const handleCopyMessage = (guest: Guest, index: number) => {
    const fullMessage = getFullInvitationMessage(guest);

    navigator.clipboard.writeText(fullMessage).then(() => {
      setCopiedMsgIndex(index);
      setTimeout(() => setCopiedMsgIndex(null), 2000);
    });
  };

  // Format phone numbers to meet WhatsApp standard (removing spaces, symbols, and prepending DR '1' if 10-digits)
  const formatPhoneForWhatsApp = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, ""); // Remove all non-digits
    if (!digits) return "";
    
    // Prepend '1' if it's a 10-digit Dominican number (809, 829, 849)
    if (digits.length === 10 && (digits.startsWith("809") || digits.startsWith("829") || digits.startsWith("849"))) {
      return "1" + digits;
    }
    return digits;
  };

  // Helper to generate WhatsApp sharing URL with pre-filled invitation
  const getWhatsAppUrl = (guest: Guest) => {
    const fullMessage = getFullInvitationMessage(guest);

    const formattedPhone = guest.phone ? formatPhoneForWhatsApp(guest.phone) : "";
    if (formattedPhone) {
      return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(fullMessage)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
  };

  const updateGuestStatus = async (
    guest: Guest,
    action: "mark-invitation-sent" | "mark-reminder-sent",
  ) => {
    try {
      const response = await fetch(`/api/admin/guests/${encodeURIComponent(guest.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = (await response.json()) as { updatedAt?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el estado.");
      const field = action === "mark-invitation-sent" ? "invitationSentAt" : "reminderSentAt";
      setGuests((current) =>
        current.map((item) =>
          item.id === guest.id
            ? { ...item, [field]: data.updatedAt || item[field] || new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      console.error("No se pudo registrar el envío:", error);
    }
  };

  const getReminderMessage = (guest: Guest, deadline: Date) => {
    const personalUrl = `${window.location.origin}/?guest=${guest.id}&token=${guest.token}`;
    const deadlineText = deadline.toLocaleDateString("es-DO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const plural = Boolean(guest.companion?.trim());

    return plural
      ? `¡Hola ${guest.name}! 🤍 Esperamos que estén muy bien. Queríamos recordarles con mucho cariño que aún tienen pendiente confirmar su asistencia a nuestra boda. 🥂💍\n\nSu invitación estará disponible hasta el ${deadlineText}. Pueden ver todos los detalles y dejarnos saber su respuesta aquí:\n\n${personalUrl}\n\nComo estamos organizando cada detalle y contamos con cupos limitados, si no recibimos su confirmación antes de esa fecha entenderemos que en esta ocasión no podrán acompañarnos.\n\nNos encantaría celebrar con ustedes. ¡Esperamos su respuesta! ✨`
      : `¡Hola ${guest.name}! 🤍 Esperamos que estés muy bien. Queríamos recordarte con mucho cariño que aún tienes pendiente confirmar tu asistencia a nuestra boda. 🥂💍\n\nTu invitación estará disponible hasta el ${deadlineText}. Puedes ver todos los detalles y dejarnos saber tu respuesta aquí:\n\n${personalUrl}\n\nComo estamos organizando cada detalle y contamos con cupos limitados, si no recibimos tu confirmación antes de esa fecha entenderemos que en esta ocasión no podrás acompañarnos.\n\nNos encantaría celebrar contigo. ¡Esperamos tu respuesta! ✨`;
  };

  const getReminderWhatsAppUrl = (guest: Guest, deadline: Date) => {
    const phone = guest.phone ? formatPhoneForWhatsApp(guest.phone) : "";
    const message = getReminderMessage(guest, deadline);
    return `https://api.whatsapp.com/send${phone ? `?phone=${phone}&` : "?"}text=${encodeURIComponent(message)}`;
  };

  const handleCopyReminder = async (guest: Guest, deadline: Date, index: number) => {
    await navigator.clipboard.writeText(getReminderMessage(guest, deadline));
    setCopiedMsgIndex(index);
    setTimeout(() => setCopiedMsgIndex(null), 2000);
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
          dateStr = new Date(r.created).toLocaleString();
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

  // Statistics calculations (Exact headcounts based on singular and plural choices)
  const totalRSVPs = rsvps.length;
  const totalGuestsInDB = guests.length;

  // Calculate exact headcount of confirmed individuals
  let attendingCount = 0;
  rsvps.forEach((r) => {
    if (r.attending === "Sí asistiré" || r.attending.startsWith("Solo asistirá")) {
      attendingCount += 1;
    } else if (r.attending === "Ambos asistiremos") {
      attendingCount += 2;
    }
  });

  // Calculate exact headcount of declining individuals
  let notAttendingCount = 0;
  rsvps.forEach((r) => {
    if (r.attending === "No podré asistir") {
      notAttendingCount += 1;
    } else if (r.attending === "Ninguno asistirá") {
      notAttendingCount += 2;
    } else if (r.attending.startsWith("Solo asistirá")) {
      // In a couple, if only 1 is attending, 1 is declining!
      notAttendingCount += 1;
    }
  });

  const answeredGuestIds = new Set(rsvps.map((r) => r.guestId || r.id));
  const unansweredGuests = guests
    .filter((guest) => !answeredGuestIds.has(guest.id))
    .map((guest) => {
      const startValue = guest.invitationSentAt || guest.createdAt;
      const startDate = startValue ? new Date(startValue) : null;
      const deadline =
        startDate && !Number.isNaN(startDate.getTime())
          ? new Date(startDate.getTime() + INVITATION_DURATION_MS)
          : null;
      const remainingMs = deadline ? deadline.getTime() - Date.now() : null;
      return {
        guest,
        deadline,
        remainingMs,
        isDue:
          remainingMs !== null && remainingMs > 0 && remainingMs <= REMINDER_WINDOW_MS,
        isExpired: remainingMs !== null && remainingMs <= 0,
      };
    })
    .sort((a, b) =>
      (a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER) -
      (b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );
  const dueReminderCount = unansweredGuests.filter((item) => item.isDue).length;

  const formatRemainingTime = (remainingMs: number | null) => {
    if (remainingMs === null) return "Fecha no disponible";
    if (remainingMs <= 0) return "Plazo vencido";
    const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    if (days === 0) return `${hours} h restantes`;
    return `${days} d${hours ? ` ${hours} h` : ""} restantes`;
  };

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
            <button
              onClick={() => setActiveTab("reminders")}
              className={`px-5 py-2.5 rounded-lg text-sm tracking-[1px] font-medium transition-all cursor-pointer ${
                activeTab === "reminders"
                  ? "bg-[#3A2A23] text-white"
                  : "text-[#8a8178] hover:text-[#3A2A23] hover:bg-white border border-transparent"
              }`}
            >
              Recordatorios ({dueReminderCount})
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
                          {r.created ? new Date(r.created).toLocaleDateString() : "—"}
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
                {editingGuestId ? "Editar Invitado" : "Añadir Nuevo Invitado"}
              </h3>

              {editingGuestId && (
                <p className="text-xs text-[#8a8178] mb-4 leading-relaxed">
                  El enlace y el token de seguridad permanecerán iguales.
                </p>
              )}

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
                    Teléfono / Celular (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 8091234567"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none focus:border-[#C7A27C] transition-all bg-[#FAF8F5] text-[#3A2A23]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#8a8178] uppercase tracking-[0.5px] font-medium">
                    Acompañante(s) (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ailyn Santana"
                    value={newGuestCompanion}
                    onChange={(e) => setNewGuestCompanion(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none focus:border-[#C7A27C] transition-all bg-[#FAF8F5] text-[#3A2A23]"
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
                  {addingGuest
                    ? editingGuestId
                      ? "Guardando..."
                      : "Añadiendo..."
                    : editingGuestId
                      ? "Guardar Cambios"
                      : "Añadir Invitado"}
                </button>
                {editingGuestId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={addingGuest}
                    className="border border-[#e5e0d8] hover:border-[#C7A27C] disabled:opacity-40 text-[#8a8178] text-xs uppercase tracking-[1.5px] font-bold py-3 rounded-lg transition-all cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                )}
              </form>

              <div className="mt-7 pt-6 border-t border-[#e5e0d8]">
                <h3 className="text-sm uppercase tracking-[1.5px] font-bold text-[#3A2A23]">
                  Importar desde Excel
                </h3>
                <p className="text-xs text-[#8a8178] mt-2 leading-relaxed">
                  El nombre es obligatorio. Teléfono y acompañante son opcionales.
                </p>
                <button
                  type="button"
                  onClick={() => void handleDownloadTemplate()}
                  className="w-full mt-4 border border-[#C7A27C] text-[#8b6747] hover:bg-[#FAF8F5] text-xs uppercase tracking-[1px] font-bold py-3 rounded-lg transition-all cursor-pointer"
                >
                  📥 Descargar plantilla
                </button>
                <label className="block mt-3 w-full border border-dashed border-[#d7cec4] hover:border-[#C7A27C] bg-[#FAF8F5] text-[#8a8178] text-xs text-center py-4 px-3 rounded-lg transition-all cursor-pointer">
                  📊 {importFileName || "Seleccionar archivo .xlsx"}
                  <input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(event) => void handleImportFile(event.target.files?.[0])}
                  />
                </label>

                {importError && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                    {importError}
                  </p>
                )}

                {importRows.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#3A2A23]">
                        Vista previa: {importRows.length} invitaciones
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImportRows([]);
                          setImportFileName("");
                          setImportError("");
                        }}
                        className="text-[10px] uppercase tracking-[0.5px] text-red-500 cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="mt-3 max-h-52 overflow-y-auto border border-[#e5e0d8] rounded-lg divide-y divide-[#f0ebe4]">
                      {importRows.map((row) => (
                        <div key={row.row} className="p-3 bg-white text-xs">
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-[#3A2A23]">{row.name || "Sin nombre"}</span>
                            <span className="text-[#aaa198]">Fila {row.row}</span>
                          </div>
                          <p className="text-[#8a8178] mt-1">
                            {row.phone || "Sin teléfono"}
                            {row.companion ? ` · Con ${row.companion}` : " · Sin acompañante"}
                          </p>
                          {row.error && <p className="text-red-600 mt-1">{row.error}</p>}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleBulkImport()}
                      disabled={importingGuests || importRows.some((row) => row.error)}
                      className="w-full mt-3 bg-[#7A8468] hover:bg-[#6A7458] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs uppercase tracking-[1px] font-bold py-3.5 rounded-lg transition-all cursor-pointer"
                    >
                      {importingGuests ? "Importando..." : `Importar ${importRows.length} invitados`}
                    </button>
                  </div>
                )}
              </div>
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

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {/* EDITAR DATOS DEL INVITADO */}
                        <button
                          onClick={() => handleEditGuest(g)}
                          className="text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer border bg-white border-[#e5e0d8] hover:border-[#C7A27C] text-[#3A2A23]"
                          title="Editar nombre, teléfono o acompañante"
                        >
                          ✏️ Editar
                        </button>

                        {/* COPIAR SOLO EL LINK */}
                        <button
                          onClick={() => handleCopyLink(g, index)}
                          className={`text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                            copiedIndex === index
                              ? "bg-[#e2f0d9] border-[#c0e0cc] text-[#4d713c]"
                              : "bg-white border-[#e5e0d8] hover:border-[#C7A27C] text-[#3A2A23]"
                          }`}
                          title="Copiar solo el link de acceso"
                        >
                          {copiedIndex === index ? "¡Link Copiado! ✓" : "📋 Link"}
                        </button>

                        {/* COPIAR MENSAJE COMPLETO */}
                        <button
                          onClick={() => handleCopyMessage(g, index)}
                          className={`text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                            copiedMsgIndex === index
                              ? "bg-[#e2f0d9] border-[#c0e0cc] text-[#4d713c]"
                              : "bg-white border-[#e5e0d8] hover:border-[#C7A27C] text-[#3A2A23]"
                          }`}
                          title="Copiar mensaje de invitación completo"
                        >
                          {copiedMsgIndex === index ? "¡Mensaje Copiado! ✓" : "✉️ Copiar Mensaje"}
                        </button>

                        {/* ENVIAR POR WHATSAPP DIRECTO */}
                        <a
                          href={getWhatsAppUrl(g)}
                          onClick={() => void updateGuestStatus(g, "mark-invitation-sent")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg transition-all cursor-pointer border bg-[#e2f0d9] border-[#c0e0cc] text-[#4d713c] hover:bg-[#d0eac3] text-center"
                          style={{ textDecoration: "none" }}
                          title="Enviar invitación directamente por WhatsApp"
                        >
                          💬 WhatsApp
                        </a>

                        {/* ELIMINAR INVITADO */}
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

        {/* Tab 3: Assisted WhatsApp reminders */}
        {activeTab === "reminders" && (
          <div className="mt-6 flex flex-col gap-5">
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm">
              <h3 className="text-base uppercase tracking-[1.5px] font-bold text-[#3A2A23]">
                Recordatorios de confirmación
              </h3>
              <p className="text-sm text-[#8a8178] mt-2 leading-relaxed max-w-3xl">
                Aquí aparecen las invitaciones que aún no tienen respuesta. El botón de WhatsApp se
                habilita durante los últimos dos días del plazo y abre un mensaje personalizado para
                que puedas revisarlo antes de enviarlo.
              </p>
            </div>

            {loading ? (
              <div className="bg-white border border-[#e5e0d8] rounded-2xl p-12 text-center text-[#8a8178] animate-pulse text-sm">
                Revisando invitaciones pendientes...
              </div>
            ) : unansweredGuests.length === 0 ? (
              <div className="bg-white border border-[#e5e0d8] rounded-2xl p-12 text-center text-[#8a8178] text-sm">
                Todos los invitados han respondido. 🤍
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unansweredGuests.map(({ guest, deadline, remainingMs, isDue, isExpired }, index) => {
                  const hasPhone = Boolean(guest.phone && formatPhoneForWhatsApp(guest.phone));
                  const canSend = Boolean(deadline && hasPhone && isDue);
                  const statusLabel = isExpired
                    ? "Vencida"
                    : isDue
                      ? "Enviar ahora"
                      : "Aún no corresponde";

                  return (
                    <div
                      key={guest.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm ${
                        isDue ? "border-[#C7A27C]" : "border-[#e5e0d8]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-[#3A2A23]">{guest.name}</h4>
                          {guest.companion && (
                            <p className="text-xs text-[#8a8178] mt-1">Con {guest.companion}</p>
                          )}
                          <p className="text-xs text-[#8a8178] mt-1">
                            {guest.phone || "Sin teléfono registrado"}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-[0.8px] font-bold px-2.5 py-1 rounded-full ${
                            isDue
                              ? "bg-[#fff4df] text-[#9a681f]"
                              : isExpired
                                ? "bg-red-50 text-red-600"
                                : "bg-[#FAF8F5] text-[#8a8178]"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#f0ebe4] text-xs text-[#8a8178] space-y-1">
                        <p>
                          Vence: {deadline ? deadline.toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                        </p>
                        <p className={isDue ? "font-semibold text-[#9a681f]" : ""}>
                          {formatRemainingTime(remainingMs)}
                        </p>
                        {guest.reminderSentAt && (
                          <p className="text-[#4d713c]">
                            ✓ Recordatorio preparado el {new Date(guest.reminderSentAt).toLocaleString("es-DO")}
                          </p>
                        )}
                      </div>

                      {!hasPhone && (
                        <p className="text-xs text-red-500 mt-3">Añade un teléfono para habilitar WhatsApp.</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          type="button"
                          disabled={!deadline || !isDue}
                          onClick={() => deadline && void handleCopyReminder(guest, deadline, index)}
                          className="text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg border border-[#e5e0d8] bg-white text-[#3A2A23] enabled:hover:border-[#C7A27C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {copiedMsgIndex === index ? "¡Copiado! ✓" : "✉️ Copiar mensaje"}
                        </button>
                        {canSend && deadline ? (
                          <a
                            href={getReminderWhatsAppUrl(guest, deadline)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => void updateGuestStatus(guest, "mark-reminder-sent")}
                            className="text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg border bg-[#e2f0d9] border-[#c0e0cc] text-[#4d713c] hover:bg-[#d0eac3]"
                            style={{ textDecoration: "none" }}
                          >
                            💬 Abrir WhatsApp
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="text-xs uppercase tracking-[0.5px] font-semibold px-3 py-2 rounded-lg border border-[#e5e0d8] bg-gray-50 text-gray-400 cursor-not-allowed"
                          >
                            💬 Abrir WhatsApp
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
