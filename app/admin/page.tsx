"use client";

import { useEffect, useState } from "react";
import { formatNames, MAX_COMPANIONS, normalizeCompanions } from "@/lib/guest-names";

// Interface Definitions
interface RSVPResponse {
  id: string;
  guestId: string;
  guestName: string;
  name?: string; // Soporte para registros antiguos de prueba
  attending: string;
  attendees?: string[];
  invitedCount?: number;
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
  companions?: string[];
  invitationSentAt?: string | null;
  reminderSentAt?: string | null;
}

interface ImportGuestRow {
  row: number;
  name: string;
  phone: string;
  companions: string[];
  error?: string;
}

interface AdminMoment {
  id: string;
  authorName: string;
  caption: string;
  mediaType: "image" | "video" | "message";
  mediaUrl: string;
  likes: number;
  created: string | null;
  category: string;
  visibility: "public" | "private";
  featured: boolean;
  status: "published" | "hidden";
}

const INVITATION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const REMINDER_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

const getGuestCompanions = (guest: Pick<Guest, "companions" | "companion">) =>
  normalizeCompanions(guest.companions, guest.companion);

const parseCompanionInput = (value: string) =>
  value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorErrorMsg] = useState("");

  // Dashboard Data State
  const [rsvps, setRsvps] = useState<RSVPResponse[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "rsvps" | "guests" | "reminders" | "moments">("overview");
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
  const [moments, setMoments] = useState<AdminMoment[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);
  const [momentsError, setMomentsError] = useState("");
  const [momentsOpen, setMomentsOpen] = useState(true);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<"all" | "confirmed" | "pending" | "declined" | "companion" | "unsent">("all");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [reminderFilter, setReminderFilter] = useState<"all" | "due" | "expired" | "sent" | "later">("all");
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [momentFilter, setMomentFilter] = useState<"all" | "public" | "private" | "featured" | "hidden" | "image" | "video" | "message">("all");
  const [selectedMoments, setSelectedMoments] = useState<Set<string>>(new Set());
  
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

  useEffect(() => {
    if (!isAuthenticated || activeTab !== "moments") return;
    async function loadMoments() {
      setMomentsLoading(true);
      setMomentsError("");
      try {
        const response = await fetch("/api/moments/posts", { cache: "no-store" });
        const data = (await response.json()) as { posts?: AdminMoment[]; albumOpen?: boolean; error?: string };
        if (!response.ok) throw new Error(data.error || "No se pudieron cargar los momentos.");
        setMoments(data.posts || []);
        setMomentsOpen(data.albumOpen !== false);
      } catch (error) {
        setMomentsError(error instanceof Error ? error.message : "No se pudieron cargar los momentos.");
      } finally {
        setMomentsLoading(false);
      }
    }
    void loadMoments();
  }, [activeTab, isAuthenticated]);

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
          companions: parseCompanionInput(newGuestCompanion),
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
      setShowGuestForm(false);
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
    setNewGuestCompanion(getGuestCompanions(guest).join("\n"));
    setShowGuestForm(true);
  };

  const handleCancelEdit = () => {
    setEditingGuestId(null);
    setNewGuestName("");
    setNewGuestId("");
    setNewGuestToken("");
    setNewGuestPhone("");
    setNewGuestCompanion("");
    setShowGuestForm(false);
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
      ...Array.from({ length: MAX_COMPANIONS }, (_, index) => ({
        header: `Acompañante ${index + 1}`,
        key: `companion${index + 1}`,
        width: 30,
      })),
    ];
    worksheet.addRow({
      name: "Ejemplo: Juan Pérez",
      phone: "8095551234",
      companion1: "Ejemplo: María Rodríguez",
      companion2: "Ejemplo: Pedro Pérez",
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
      const companionColumns = Array.from({ length: MAX_COMPANIONS }, (_, index) =>
        headerIndexes.get(`acompanante ${index + 1}`),
      );
      const legacyCompanionColumn = headerIndexes.get("acompanante") ?? headerIndexes.get("invitado");
      if (!companionColumns[0] && legacyCompanionColumn) companionColumns[0] = legacyCompanionColumn;
      if (!nameColumn) {
        throw new Error('No encontramos la columna obligatoria "Nombre completo".');
      }

      const rows: ImportGuestRow[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = String(row.getCell(nameColumn).text).trim();
        const phone = phoneColumn ? String(row.getCell(phoneColumn).text).trim() : "";
        const companions = companionColumns
          .map((column) => column ? String(row.getCell(column).text).trim() : "")
          .filter(Boolean);
        if (!name && !phone && companions.length === 0) return;
        let error: string | undefined;
        if (!name) error = "Falta el nombre.";
        else if (name.length > 120) error = "El nombre es demasiado largo.";
        else if (phone.length > 30) error = "El teléfono es demasiado largo.";
        else if (companions.some((companion) => companion.length > 120)) error = "Un acompañante es demasiado largo.";
        rows.push({ row: rowNumber, name, phone, companions, error });
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

  const handleDeleteMoment = async (moment: AdminMoment) => {
    if (!confirm(`¿Eliminar la publicación de ${moment.authorName}? El archivo también será eliminado.`)) return;
    const response = await fetch(`/api/moments/posts/${moment.id}`, { method: "DELETE" });
    if (response.status === 401) {
      setIsAuthenticated(false);
      return;
    }
    if (!response.ok) {
      alert("No se pudo eliminar el momento.");
      return;
    }
    setMoments((current) => current.filter((item) => item.id !== moment.id));
  };

  const handleMomentAction = async (
    moment: AdminMoment,
    action: "hide" | "restore" | "toggle-featured",
  ) => {
    const response = await fetch(`/api/moments/posts/${moment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      alert("No se pudo actualizar la publicación.");
      return;
    }
    setMoments((current) =>
      current.map((item) =>
        item.id === moment.id
          ? {
              ...item,
              status: action === "hide" ? "hidden" : action === "restore" ? "published" : item.status,
              featured: action === "toggle-featured" ? !item.featured : item.featured,
            }
          : item,
      ),
    );
  };

  const handleToggleMomentsOpen = async () => {
    const nextOpen = !momentsOpen;
    const response = await fetch("/api/admin/moments/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: nextOpen }),
    });
    if (!response.ok) {
      alert("No se pudo cambiar el estado del álbum.");
      return;
    }
    setMomentsOpen(nextOpen);
  };

  const handleDownloadMoments = async () => {
    const response = await fetch("/api/admin/moments/download");
    const data = (await response.json()) as { downloadUrl?: string; error?: string };
    if (!response.ok || !data.downloadUrl) {
      alert(data.error || "No se pudo preparar la descarga.");
      return;
    }
    window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleBulkMomentAction = async (action: "hide" | "restore" | "toggle-featured" | "delete") => {
    const chosen = moments.filter((item) => selectedMoments.has(item.id));
    if (!chosen.length) return;
    if (action === "delete" && !confirm(`¿Eliminar permanentemente ${chosen.length} publicaciones y sus archivos?`)) return;
    for (const moment of chosen) {
      const response = await fetch(`/api/moments/posts/${moment.id}`, action === "delete" ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!response.ok) { alert(`No se pudo procesar la publicación de ${moment.authorName}.`); break; }
      setMoments((current) => action === "delete" ? current.filter(item => item.id !== moment.id) : current.map(item => item.id === moment.id ? { ...item, status: action === "hide" ? "hidden" : action === "restore" ? "published" : item.status, featured: action === "toggle-featured" ? !item.featured : item.featured } : item));
    }
    setSelectedMoments(new Set());
  };

  const momentDownloadUrl = (url: string) => url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;

  const handleBulkGuestAction = async (action: "mark-invitation-sent" | "delete") => {
    const chosen = guests.filter((guest) => selectedGuestIds.has(guest.id));
    if (!chosen.length) return;
    if (action === "delete" && !confirm(`¿Eliminar ${chosen.length} invitados seleccionados? Sus enlaces dejarán de funcionar.`)) return;
    for (const guest of chosen) {
      const response = await fetch(`/api/admin/guests/${encodeURIComponent(guest.id)}`, action === "delete" ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      if (!response.ok) { alert(`No se pudo actualizar a ${guest.name}.`); break; }
      if (action === "delete") setGuests((current) => current.filter((item) => item.id !== guest.id));
      else setGuests((current) => current.map((item) => item.id === guest.id ? { ...item, invitationSentAt: item.invitationSentAt || new Date().toISOString() } : item));
    }
    setSelectedGuestIds(new Set());
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

  // Generate the personalized invitation message for the primary WhatsApp recipient.
  const getFullInvitationMessage = (guest: Guest) => {
    const baseUrl = window.location.origin;
    const personalUrl = `${baseUrl}/?guest=${guest.id}&token=${guest.token}`;

    return `Hola, ${guest.name} 🤍\n\nHoy faltan exactamente 100 días para nuestro gran día y estamos muy felices de compartir contigo nuestra invitación. Ahí encontrarás todos los detalles de la celebración:\n\n${personalUrl}\n\n👉 Por favor, asegúrate de deslizar hasta el final de la página para consultar algunas preguntas y respuestas que pueden servirte de ayuda, así como para confirmar tu asistencia.\n\nNota: Como los cupos de nuestra boda son muy limitados, esta invitación es personal y válida únicamente para ti y para las personas que estén detalladas en ella. Si no se especifica un acompañante o pase adicional, te pedimos de corazón respetar este límite. ¡Esperamos que puedas entenderlo! 🤍\n\nRecuerda que tienes un plazo de 7 días, a partir de hoy, para confirmar tu asistencia a través de la página web. ¡Ojalá puedas acompañarnos!\n\nCon cariño,\nLuis & Ailyn`;
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
    const hasCompanions = getGuestCompanions(guest).length > 0;
    const confirmationScope = hasCompanions
      ? "tu asistencia y la de las demás personas incluidas en tu invitación"
      : "tu asistencia";
    const celebrationScope = hasCompanions
      ? "contigo y con las demás personas incluidas en tu invitación"
      : "contigo";

    return `¡Hola, ${guest.name}! 🤍\n\nEsperamos que estés muy bien. Queríamos recordarte con mucho cariño que aún tienes pendiente confirmar ${confirmationScope} a nuestra boda. 🥂💍\n\nTu invitación estará disponible hasta el ${deadlineText}. Puedes ver todos los detalles y dejarnos saber tu respuesta aquí:\n\n${personalUrl}\n\nComo estamos organizando cada detalle y contamos con cupos limitados, si no recibimos tu confirmación antes de esa fecha, entenderemos que no podrás acompañarnos y liberaremos los lugares reservados en tu invitación.\n\nNos encantaría celebrar ${celebrationScope}. ¡Esperamos tu respuesta! ✨`;
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
    if (dashboardRsvps.length === 0) {
      alert("No hay confirmaciones registradas para exportar.");
      return;
    }

    const headers = ["Nombre", "Asistencia", "Mensaje", "Fecha de Confirmación"];
    
    // Safely map rsvps properties, handling undefined/null elements
    const rows = dashboardRsvps.map((r) => {
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
  const totalGuestsInDB = guests.length;
  const currentGuestIds = new Set(guests.map((guest) => guest.id));
  const rsvpByGuestId = new Map<string, RSVPResponse>();
  rsvps.forEach((response) => {
    const guestId = response.guestId || response.id;
    if (!currentGuestIds.has(guestId)) return;
    const previous = rsvpByGuestId.get(guestId);
    if (!previous || String(response.created || "") >= String(previous.created || "")) {
      rsvpByGuestId.set(guestId, response);
    }
  });
  const dashboardRsvps = [...rsvpByGuestId.values()];
  const totalRSVPs = dashboardRsvps.length;

  // Calculate exact headcount of confirmed individuals
  let attendingCount = 0;
  dashboardRsvps.forEach((r) => {
    if (Array.isArray(r.attendees)) {
      attendingCount += r.attendees.length;
      return;
    }
    if (r.attending === "Sí asistiré" || r.attending.startsWith("Solo asistirá")) {
      attendingCount += 1;
    } else if (r.attending === "Ambos asistiremos") {
      attendingCount += 2;
    }
  });

  // Calculate exact headcount of declining individuals
  let notAttendingCount = 0;
  dashboardRsvps.forEach((r) => {
    if (Array.isArray(r.attendees) && typeof r.invitedCount === "number") {
      notAttendingCount += Math.max(0, r.invitedCount - r.attendees.length);
      return;
    }
    if (r.attending === "No podré asistir") {
      notAttendingCount += 1;
    } else if (r.attending === "Ninguno asistirá") {
      notAttendingCount += 2;
    } else if (r.attending.startsWith("Solo asistirá")) {
      // In a couple, if only 1 is attending, 1 is declining!
      notAttendingCount += 1;
    }
  });

  const answeredGuestIds = new Set(rsvpByGuestId.keys());
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
  const expiredGuestIds = new Set(
    unansweredGuests.filter((item) => item.isExpired).map((item) => item.guest.id),
  );
  notAttendingCount += unansweredGuests
    .filter((item) => item.isExpired)
    .reduce(
      (total, item) => total + 1 + getGuestCompanions(item.guest).length,
      0,
    );
  const filteredUnansweredGuests = unansweredGuests.filter((item) => reminderFilter === "all" || (reminderFilter === "due" && item.isDue) || (reminderFilter === "expired" && item.isExpired) || (reminderFilter === "sent" && Boolean(item.guest.reminderSentAt)) || (reminderFilter === "later" && !item.isDue && !item.isExpired));
  const expectedPeople = guests.reduce((total, guest) => total + 1 + getGuestCompanions(guest).length, 0);
  const responseRate = totalGuestsInDB ? Math.round((totalRSVPs / totalGuestsInDB) * 100) : 0;
  const invitationSentCount = guests.filter((guest) => guest.invitationSentAt).length;
  const getGuestResponseStatus = (guest: Guest) => {
    const response = rsvpByGuestId.get(guest.id);
    if (!response) {
      return expiredGuestIds.has(guest.id) ? "expired" as const : "pending" as const;
    }
    return response.attending === "No podré asistir" || response.attending === "Ninguno asistirá"
      ? "declined" as const
      : "confirmed" as const;
  };
  const getRsvpAttendanceDetails = (response: RSVPResponse) => {
    const guest = guests.find((item) => item.id === (response.guestId || response.id));
    const invitedNames = guest
      ? [guest.name, ...getGuestCompanions(guest)]
      : [response.guestName || response.name || "Invitado"];

    let attendingNames: string[];
    if (Array.isArray(response.attendees)) {
      attendingNames = response.attendees;
    } else if (response.attending === "No podré asistir" || response.attending === "Ninguno asistirá") {
      attendingNames = [];
    } else if (response.attending === "Sí asistiré") {
      attendingNames = invitedNames.slice(0, 1);
    } else if (response.attending === "Ambos asistiremos") {
      attendingNames = invitedNames.slice(0, 2);
    } else if (response.attending === "Todos asistiremos") {
      attendingNames = invitedNames;
    } else if (response.attending.startsWith("Solo asistirá ")) {
      attendingNames = [response.attending.replace("Solo asistirá ", "").trim()];
    } else if (response.attending.startsWith("Asistirán: ")) {
      attendingNames = response.attending
        .replace("Asistirán: ", "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    } else {
      attendingNames = invitedNames;
    }

    const attendingSet = new Set(attendingNames);
    return {
      attendingNames,
      decliningNames: invitedNames.filter((name) => !attendingSet.has(name)),
    };
  };
  const filteredGuests = guests
    .filter((guest) => {
      const query = guestSearch.trim().toLocaleLowerCase("es");
      const matchesSearch = !query || [guest.name, guest.phone, ...getGuestCompanions(guest)].some((value) => value?.toLocaleLowerCase("es").includes(query));
      const status = getGuestResponseStatus(guest);
      const matchesFilter = guestFilter === "all" || guestFilter === status || (guestFilter === "declined" && status === "expired") || (guestFilter === "companion" && getGuestCompanions(guest).length > 0) || (guestFilter === "unsent" && !guest.invitationSentAt);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  const selectedGuest = guests.find((guest) => guest.id === selectedGuestId) ?? null;
  const filteredMoments = moments.filter((moment) => momentFilter === "all" || (momentFilter === "public" && moment.visibility === "public") || (momentFilter === "private" && moment.visibility === "private") || (momentFilter === "featured" && moment.featured) || (momentFilter === "hidden" && moment.status === "hidden") || moment.mediaType === momentFilter);

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

      <div className="max-w-[1500px] mx-auto flex items-start">
        <aside className="hidden lg:flex w-64 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] px-4 py-7 flex-col border-r border-[#e5e0d8] bg-[#f7f3ed]">
          <p className="px-3 text-[10px] uppercase tracking-[2px] text-[#a2968b] font-bold mb-3">Organización</p>
          {([
            ["overview", "Resumen", "⌂"], ["guests", "Invitados", "◇"], ["rsvps", "Confirmaciones", "✓"], ["reminders", "Recordatorios", "◷"], ["moments", "Momentos", "□"],
          ] as const).map(([tab, label, icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left cursor-pointer transition-all mb-1 ${activeTab === tab ? "bg-[#3A2A23] text-white shadow-sm" : "text-[#75695f] hover:bg-white hover:text-[#3A2A23]"}`}>
              <span className={`w-7 h-7 rounded-lg grid place-items-center text-sm ${activeTab === tab ? "bg-white/10 text-[#e0bd98]" : "bg-white text-[#a7825e]"}`}>{icon}</span>
              <span className="flex-1">{label}</span>
              {tab === "reminders" && dueReminderCount > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-[#C7A27C] text-white text-[10px] grid place-items-center">{dueReminderCount}</span>}
            </button>
          ))}
          <div className="mt-auto rounded-2xl bg-white border border-[#e5e0d8] p-4">
            <p className="text-[10px] uppercase tracking-[1px] text-[#8a8178]">Respuestas</p>
            <p className="text-2xl font-light mt-1">{responseRate}%</p>
            <div className="h-1.5 rounded-full bg-[#eee8df] mt-3 overflow-hidden"><div className="h-full bg-[#7A8468] rounded-full" style={{ width: `${Math.min(100, responseRate)}%` }} /></div>
          </div>
        </aside>

      <main className="min-w-0 flex-1 max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        {/* Statistics Widgets */}
        {activeTab === "overview" && <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-5">
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
            <span className="text-xs tracking-[1.5px] uppercase font-bold text-[#8a8178]">Invitaciones</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-light text-[#3A2A23]">{totalGuestsInDB}</span>
              <span className="text-xs text-[#8a8178]">registradas</span>
            </div>
          </div>
        </div>}

        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 lg:mt-0 border-b border-[#e5e0d8] pb-4">
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button onClick={() => setActiveTab("overview")} className={`shrink-0 px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${activeTab === "overview" ? "bg-[#3A2A23] text-white" : "bg-white text-[#8a8178]"}`}>Resumen</button>
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
            <button
              onClick={() => setActiveTab("moments")}
              className={`px-5 py-2.5 rounded-lg text-sm tracking-[1px] font-medium transition-all cursor-pointer ${
                activeTab === "moments"
                  ? "bg-[#3A2A23] text-white"
                  : "text-[#8a8178] hover:text-[#3A2A23] hover:bg-white border border-transparent"
              }`}
            >
              Momentos
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

        {activeTab === "overview" && (
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-5">
            <section className="xl:col-span-3 bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] uppercase tracking-[1.5px] font-bold text-[#8a8178]">Progreso general</p><h2 className="text-xl mt-1">Confirmación de invitados</h2></div>
                <span className="text-3xl font-light text-[#7A8468]">{responseRate}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#eee8df] mt-6 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#9aa287] to-[#7A8468] transition-all" style={{ width: `${Math.min(100, responseRate)}%` }} /></div>
              <p className="text-xs text-[#8a8178] mt-3">{totalRSVPs} de {totalGuestsInDB} invitaciones han respondido.</p>
              <div className="grid grid-cols-3 gap-3 mt-7">
                <button onClick={() => { setGuestFilter("confirmed"); setActiveTab("guests"); }} className="rounded-xl bg-[#eef3e9] p-4 text-left cursor-pointer"><span className="block text-2xl text-[#5f704e]">{guests.filter(g => getGuestResponseStatus(g) === "confirmed").length}</span><span className="text-[10px] uppercase tracking-[.8px] text-[#68735e]">Confirmadas</span></button>
                <button onClick={() => { setGuestFilter("declined"); setActiveTab("guests"); }} className="rounded-xl bg-[#fff0ed] p-4 text-left cursor-pointer"><span className="block text-2xl text-[#b75e52]">{guests.filter(g => ["declined", "expired"].includes(getGuestResponseStatus(g))).length}</span><span className="text-[10px] uppercase tracking-[.8px] text-[#9c665f]">Declinaron</span></button>
                <button onClick={() => { setGuestFilter("pending"); setActiveTab("guests"); }} className="rounded-xl bg-[#fff6e7] p-4 text-left cursor-pointer"><span className="block text-2xl text-[#ad7a32]">{guests.filter(g => getGuestResponseStatus(g) === "pending").length}</span><span className="text-[10px] uppercase tracking-[.8px] text-[#967447]">Pendientes</span></button>
              </div>
            </section>

            <section className="xl:col-span-2 bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm flex items-center gap-6">
              <div className="relative w-36 h-36 rounded-full shrink-0" style={{ background: `conic-gradient(#7A8468 0 ${responseRate}%, #eee8df ${responseRate}% 100%)` }}><div className="absolute inset-4 bg-white rounded-full grid place-items-center text-center"><div><span className="block text-2xl font-light">{expectedPeople}</span><span className="text-[9px] uppercase tracking-[1px] text-[#8a8178]">personas</span></div></div></div>
              <div><h3 className="font-semibold">Lista estimada</h3><p className="text-xs text-[#8a8178] mt-2 leading-relaxed">Incluye invitados principales y acompañantes registrados.</p><p className="text-xs text-[#5f704e] mt-4">{attendingCount} personas confirmadas</p><p className="text-xs text-[#a16a62] mt-1">{notAttendingCount} no asistirán</p></div>
            </section>

            <section className="xl:col-span-3 bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center"><h3 className="font-semibold">Respuestas recientes</h3><button onClick={() => setActiveTab("rsvps")} className="text-xs text-[#8b6747] cursor-pointer">Ver todas →</button></div>
              <div className="mt-4 divide-y divide-[#f0ebe4]">{dashboardRsvps.slice().sort((a,b) => String(b.created).localeCompare(String(a.created))).slice(0,5).map((response) => <div key={response.id} className="py-3 flex items-center justify-between gap-4"><div><p className="text-sm font-medium">{response.guestName || response.name}</p><p className="text-[10px] text-[#aaa198]">{response.created ? new Date(response.created).toLocaleDateString("es-DO") : "—"}</p></div><span className={`text-[10px] px-2.5 py-1 rounded-full ${response.attending.includes("No") || response.attending.includes("Ninguno") ? "bg-red-50 text-red-600" : "bg-[#eef3e9] text-[#5f704e]"}`}>{response.attending}</span></div>)}{dashboardRsvps.length === 0 && <p className="py-8 text-sm text-center text-[#8a8178]">Todavía no hay respuestas.</p>}</div>
            </section>

            <section className="xl:col-span-2 bg-[#3A2A23] text-white rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[1.5px] text-[#d3ae87]">Próximas acciones</p><h3 className="text-xl mt-2">Todo bajo control</h3>
              <div className="mt-5 space-y-3 text-sm"><button onClick={() => { setShowGuestForm(true); setActiveTab("guests"); }} className="w-full bg-white/8 hover:bg-white/12 rounded-xl p-3 flex justify-between cursor-pointer"><span>Agregar invitados</span><span>＋</span></button><button onClick={() => setActiveTab("reminders")} className="w-full bg-white/8 hover:bg-white/12 rounded-xl p-3 flex justify-between cursor-pointer"><span>Recordatorios por enviar</span><span className="text-[#d3ae87]">{dueReminderCount}</span></button><div className="rounded-xl p-3 flex justify-between text-white/70"><span>Invitaciones enviadas</span><span>{invitationSentCount}/{totalGuestsInDB}</span></div></div>
            </section>
          </div>
        )}

        {/* Tab 1: RSVP List */}
        {activeTab === "rsvps" && (
          <div className="bg-white border border-[#e5e0d8] rounded-2xl mt-6 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-[#8a8178] animate-pulse text-sm">Cargando confirmaciones...</div>
            ) : dashboardRsvps.length === 0 ? (
              <div className="p-12 text-center text-[#8a8178] text-sm">Ningún invitado ha confirmado todavía.</div>
            ) : (
              <><div className="sm:hidden divide-y divide-[#f0ebe4]">{dashboardRsvps.map((r) => {
                const { attendingNames, decliningNames } = getRsvpAttendanceDetails(r);
                return <article key={r.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-sm">{r.guestName || r.name || "Invitado"}</p><p className="text-[10px] text-[#aaa198] mt-1">{r.created ? new Date(r.created).toLocaleDateString("es-DO") : "—"}</p></div></div><div className="grid grid-cols-1 gap-2 mt-4"><div className="rounded-xl bg-[#eef3e9] px-3 py-2.5"><p className="text-[9px] uppercase tracking-[.8px] font-bold text-[#68735e]">Asisten</p><p className="text-xs text-[#4d713c] mt-1">{attendingNames.length ? attendingNames.join(", ") : "Nadie"}</p></div><div className="rounded-xl bg-[#fff0ed] px-3 py-2.5"><p className="text-[9px] uppercase tracking-[.8px] font-bold text-[#9c665f]">No asisten</p><p className="text-xs text-[#a16a62] mt-1">{decliningNames.length ? decliningNames.join(", ") : "Nadie"}</p></div></div>{r.message && <p className="text-xs italic text-[#8a8178] mt-3 leading-relaxed">“{r.message}”</p>}</article>;
              })}</div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#e5e0d8] text-xs uppercase tracking-[1px] text-[#8a8178]">
                      <th className="px-6 py-4.5 font-bold">Invitado</th>
                      <th className="px-6 py-4.5 font-bold">Asisten</th>
                      <th className="px-6 py-4.5 font-bold">No asisten</th>
                      <th className="px-6 py-4.5 font-bold">Mensaje de Felicitación</th>
                      <th className="px-6 py-4.5 font-bold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebd8]/50 text-sm">
                    {dashboardRsvps.map((r, i) => {
                      const { attendingNames, decliningNames } = getRsvpAttendanceDetails(r);
                      return <tr key={i} className="hover:bg-[#FAF8F5]/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#3A2A23]">{r.guestName || r.name || "Invitado sin nombre"}</td>
                        <td className="px-6 py-4 text-xs text-[#4d713c] max-w-[220px]">{attendingNames.length ? attendingNames.join(", ") : <span className="text-[#aaa198]">Nadie</span>}</td>
                        <td className="px-6 py-4 text-xs text-[#a16a62] max-w-[220px]">{decliningNames.length ? decliningNames.join(", ") : <span className="text-[#aaa198]">Nadie</span>}</td>
                        <td className="px-6 py-4 text-[#8a8178] italic max-w-md truncate" title={r.message}>
                          {r.message ? `"${r.message}"` : <span className="text-gray-300">Ninguno</span>}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#8a8178]">
                          {r.created ? new Date(r.created).toLocaleDateString() : "—"}
                        </td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div></>
            )}
          </div>
        )}

        {/* Tab 2: Guest List and Form */}
        {activeTab === "guests" && (
          <div className="mt-6">
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-4 shadow-sm mb-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa198]">⌕</span><input value={guestSearch} onChange={(event) => setGuestSearch(event.target.value)} placeholder="Buscar por nombre, teléfono o acompañante" className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#e5e0d8] text-sm outline-none focus:border-[#C7A27C]" /></div>
                <select value={guestFilter === "companion" || guestFilter === "unsent" ? guestFilter : ""} onChange={(event) => setGuestFilter((event.target.value || "all") as typeof guestFilter)} className="px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#e5e0d8] text-sm outline-none cursor-pointer"><option value="">Más filtros</option><option value="companion">Con acompañante</option><option value="unsent">Invitación no enviada</option></select>
              </div>
              <div className="flex gap-2"><button onClick={() => { handleCancelEdit(); setShowGuestForm(true); }} className="bg-[#3A2A23] text-white rounded-xl px-4 py-3 text-xs uppercase tracking-[1px] font-semibold cursor-pointer">＋ Agregar invitado</button><button onClick={() => { setShowGuestForm(true); }} className="border border-[#C7A27C] text-[#8b6747] rounded-xl px-4 py-3 text-xs uppercase tracking-[1px] font-semibold cursor-pointer">Importar Excel</button></div>
            </div>
            <div className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-[#e5e0d8] bg-white p-2 shadow-sm [scrollbar-width:none]" role="tablist" aria-label="Estado de los invitados">
              {([
                ["all", "Todos", guests.length],
                ["confirmed", "Confirmados", guests.filter((guest) => getGuestResponseStatus(guest) === "confirmed").length],
                ["pending", "Pendientes", guests.filter((guest) => getGuestResponseStatus(guest) === "pending").length],
                ["declined", "No asistirán", guests.filter((guest) => ["declined", "expired"].includes(getGuestResponseStatus(guest))).length],
              ] as const).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={guestFilter === value}
                  onClick={() => setGuestFilter(value)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    guestFilter === value
                      ? "bg-[#3A2A23] text-white shadow-sm"
                      : "text-[#75695f] hover:bg-[#FAF8F5] hover:text-[#3A2A23]"
                  }`}
                >
                  {label} <span className={guestFilter === value ? "text-white/70" : "text-[#aaa198]"}>({count})</span>
                </button>
              ))}
            </div>
            {selectedGuestIds.size > 0 && <div className="mb-5 rounded-2xl bg-[#3A2A23] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3"><span className="text-sm">{selectedGuestIds.size} invitaciones seleccionadas</span><div className="flex gap-2"><button onClick={() => void handleBulkGuestAction("mark-invitation-sent")} className="bg-white/10 rounded-lg px-3 py-2 text-xs cursor-pointer">Marcar enviadas</button><button onClick={() => void handleBulkGuestAction("delete")} className="bg-red-400/15 text-red-100 rounded-lg px-3 py-2 text-xs cursor-pointer">Eliminar</button><button onClick={() => setSelectedGuestIds(new Set())} className="text-white/60 px-2 text-xs cursor-pointer">Cancelar</button></div></div>}
          <div className={`grid grid-cols-1 ${showGuestForm ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-6`}>
            {/* Add Guest Form */}
            <div className={`${showGuestForm ? "block" : "hidden"} bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm h-fit lg:sticky lg:top-24`}>
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
                  <textarea
                    rows={4}
                    placeholder={"Un nombre por línea\nEj. Ailyn Santana\nEj. Pedro Pérez"}
                    value={newGuestCompanion}
                    onChange={(e) => setNewGuestCompanion(e.target.value)}
                    className="p-3 rounded-lg border border-[#e5e0d8] text-sm outline-none focus:border-[#C7A27C] transition-all bg-[#FAF8F5] text-[#3A2A23]"
                  />
                  <p className="text-[10px] text-[#aaa198]">Máximo {MAX_COMPANIONS} acompañantes; escribe un nombre por línea.</p>
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
                  El nombre es obligatorio. Puedes incluir hasta {MAX_COMPANIONS} acompañantes, cada uno en su propia columna.
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
                            {row.companions.length ? ` · Con ${formatNames(row.companions)}` : " · Sin acompañantes"}
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
            <div className={`${showGuestForm ? "lg:col-span-2" : ""} bg-white border border-[#e5e0d8] rounded-2xl p-4 sm:p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-4"><div><h3 className="text-base uppercase tracking-[1.5px] font-bold text-[#3A2A23]">Invitados Registrados</h3><p className="text-xs text-[#8a8178] mt-1">Mostrando {filteredGuests.length} de {guests.length} invitaciones</p></div>{showGuestForm && <button onClick={handleCancelEdit} className="text-xs text-[#8a8178] cursor-pointer">Cerrar formulario ×</button>}</div>

              {loading ? (
                <div className="p-12 text-center text-[#8a8178] animate-pulse text-sm">Cargando lista...</div>
              ) : guests.length === 0 ? (
                <div className="p-12 text-center text-[#8a8178] text-sm">No hay invitados creados todavía.</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto pr-2">
                  {filteredGuests.map((g, index) => (
                    <div
                      key={g.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#FAF8F5] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] hover:border-[#e5e0d8] transition-all gap-4"
                    >
                      <div className="flex items-start gap-3"><label className="mt-0.5 cursor-pointer"><input type="checkbox" checked={selectedGuestIds.has(g.id)} onChange={() => setSelectedGuestIds((current) => { const next = new Set(current); if (next.has(g.id)) next.delete(g.id); else next.add(g.id); return next; })} className="accent-[#7A8468]" aria-label={`Seleccionar a ${g.name}`} /></label><div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap"><button onClick={() => setSelectedGuestId(g.id)} className="font-semibold text-sm text-[#3A2A23] cursor-pointer hover:text-[#8b6747] text-left">{g.name}</button><span className={`text-[9px] uppercase tracking-[.6px] px-2 py-1 rounded-full ${getGuestResponseStatus(g) === "confirmed" ? "bg-[#e2f0d9] text-[#4d713c]" : getGuestResponseStatus(g) === "expired" ? "bg-[#f3e5e2] text-[#9f5148]" : getGuestResponseStatus(g) === "declined" ? "bg-red-50 text-red-600" : "bg-[#fff4df] text-[#9a681f]"}`}>{getGuestResponseStatus(g) === "confirmed" ? "Confirmado" : getGuestResponseStatus(g) === "expired" ? "Declinada por vencimiento" : getGuestResponseStatus(g) === "declined" ? "No asistirá" : "Pendiente"}</span></div>
                        <p className="text-xs text-[#8a8178]">{g.phone || "Sin teléfono"}{getGuestCompanions(g).length ? ` · Con ${formatNames(getGuestCompanions(g))}` : " · Invitación individual"}</p>
                      </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        <button onClick={() => setSelectedGuestId(g.id)} className="text-xs px-3 py-2 rounded-lg border bg-white border-[#e5e0d8] text-[#6f6259] cursor-pointer">Ver ficha</button>
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
              <div className="flex gap-2 overflow-x-auto mt-5 [scrollbar-width:none]">{([['all','Todos'],['due','Enviar ahora'],['expired','Vencidos'],['sent','Enviados'],['later','Más adelante']] as const).map(([value,label]) => <button key={value} onClick={() => setReminderFilter(value)} className={`shrink-0 px-3 py-2 rounded-full text-xs border cursor-pointer ${reminderFilter === value ? "bg-[#3A2A23] border-[#3A2A23] text-white" : "border-[#e5e0d8] text-[#75695f]"}`}>{label}</button>)}</div>
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
                {filteredUnansweredGuests.map(({ guest, deadline, remainingMs, isDue, isExpired }, index) => {
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
                          {getGuestCompanions(guest).length > 0 && (
                            <p className="text-xs text-[#8a8178] mt-1">Con {formatNames(getGuestCompanions(guest))}</p>
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

        {/* Tab 4: Wedding moments moderation */}
        {activeTab === "moments" && (
          <div className="mt-6">
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-6 shadow-sm mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h3 className="text-base uppercase tracking-[1.5px] font-bold text-[#3A2A23]">
                    Álbum compartido
                  </h3>
                  <p className="text-sm text-[#8a8178] mt-2 max-w-2xl">
                    Revisa las fotos y videos compartidos en <code>/momentos</code>. Al eliminar una publicación también se elimina su archivo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                  <img src="/api/admin/moments/qr" alt="Código QR de acceso al álbum" className="w-20 h-20 rounded-lg border border-[#e5e0d8] bg-white p-1" />
                  <a href="/api/admin/moments/qr" download="qr-momentos-luis-aylin.svg" className="text-xs uppercase tracking-[0.7px] font-semibold px-3 py-2.5 rounded-lg border border-[#C7A27C] text-[#8b6747] hover:bg-[#FAF8F5]" style={{ textDecoration: "none" }}>
                    📥 Descargar QR
                  </a>
                  <button onClick={() => void handleDownloadMoments()} className="text-xs uppercase tracking-[0.7px] font-semibold px-3 py-2.5 rounded-lg border border-[#7A8468] text-[#657052] hover:bg-[#f3f6ef] cursor-pointer">
                    📦 Descargar álbum
                  </button>
                  <button onClick={() => void handleToggleMomentsOpen()} className={`text-xs uppercase tracking-[0.7px] font-semibold px-3 py-2.5 rounded-lg border cursor-pointer ${momentsOpen ? "border-red-200 text-red-600 hover:bg-red-50" : "border-[#c0e0cc] text-[#4d713c] bg-[#e2f0d9]"}`}>
                    {momentsOpen ? "Cerrar publicaciones" : "Reabrir publicaciones"}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white border border-[#e5e0d8] rounded-2xl p-4 shadow-sm mb-5 flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {([['all','Todas'],['public','Públicas'],['private','Solo novios'],['featured','Favoritas'],['hidden','Ocultas'],['image','Fotos'],['video','Videos'],['message','Mensajes']] as const).map(([value,label]) => <button key={value} onClick={() => { setMomentFilter(value); setSelectedMoments(new Set()); }} className={`shrink-0 px-3 py-2 rounded-full text-xs border cursor-pointer ${momentFilter === value ? "bg-[#3A2A23] text-white border-[#3A2A23]" : "border-[#e5e0d8] text-[#7a6d64]"}`}>{label}</button>)}
              </div>
              {selectedMoments.size > 0 && <div className="flex flex-wrap gap-2 items-center"><span className="text-xs font-semibold">{selectedMoments.size} seleccionadas</span><button onClick={() => void handleBulkMomentAction('toggle-featured')} className="text-xs border rounded-lg px-2 py-2 cursor-pointer">★ Favoritas</button><button onClick={() => void handleBulkMomentAction('hide')} className="text-xs border rounded-lg px-2 py-2 cursor-pointer">🙈 Ocultar</button><button onClick={() => void handleBulkMomentAction('restore')} className="text-xs border rounded-lg px-2 py-2 cursor-pointer">👁 Restaurar</button><button onClick={() => void handleBulkMomentAction('delete')} className="text-xs border border-red-100 text-red-500 rounded-lg px-2 py-2 cursor-pointer">🗑 Eliminar</button></div>}
            </div>
            {momentsLoading ? (
              <div className="bg-white rounded-2xl border border-[#e5e0d8] p-12 text-center text-sm text-[#8a8178] animate-pulse">Cargando momentos...</div>
            ) : momentsError ? (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-6 text-sm text-red-600">{momentsError}</div>
            ) : moments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e5e0d8] p-12 text-center text-sm text-[#8a8178]">Todavía no hay publicaciones en el álbum.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMoments.map((moment) => (
                  <article key={moment.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${selectedMoments.has(moment.id) ? "border-[#7A8468] ring-2 ring-[#7A8468]/20" : "border-[#e5e0d8]"}`}>
                    <label className="absolute z-[1] m-3 bg-white/90 rounded-full w-8 h-8 grid place-items-center shadow cursor-pointer"><input type="checkbox" checked={selectedMoments.has(moment.id)} onChange={() => setSelectedMoments(current => { const next = new Set(current); if (next.has(moment.id)) next.delete(moment.id); else next.add(moment.id); return next; })} className="accent-[#7A8468]" /></label>
                    {moment.mediaType === "image" ? (
                      <img src={moment.mediaUrl} alt={moment.caption || `Publicación de ${moment.authorName}`} className="w-full aspect-square object-cover bg-[#eee8df]" />
                    ) : moment.mediaType === "video" ? (
                      <video src={moment.mediaUrl} controls playsInline preload="metadata" className="w-full aspect-square object-cover bg-black" />
                    ) : <div className="aspect-square bg-[#F5F1EA] p-8 grid place-items-center text-center"><div><p className="text-4xl">💌</p><p className="mt-4 text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>{moment.caption}</p></div></div>}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="text-sm font-semibold">{moment.authorName}</p><p className="text-[10px] text-[#aaa198] mt-0.5">{moment.created ? new Date(moment.created).toLocaleString("es-DO") : "—"} · ♥ {moment.likes}</p></div>
                        <span className={`text-[10px] uppercase tracking-[0.6px] px-2 py-1 rounded-full ${moment.visibility === "private" ? "bg-[#eee8f5] text-[#715d85]" : "bg-[#eef3e9] text-[#5f6d4e]"}`}>{moment.visibility === "private" ? "Solo novios" : moment.category}</span>
                      </div>
                      {moment.caption && <p className="text-xs text-[#8a8178] mt-3 leading-relaxed">{moment.caption}</p>}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#f0ebe4]">
                        {moment.mediaUrl && <a href={momentDownloadUrl(moment.mediaUrl)} className="text-[10px] uppercase tracking-[0.5px] px-2.5 py-2 rounded-lg border border-[#e5e0d8] text-[#657052]">⇩ Descargar</a>}
                        <button onClick={() => void handleMomentAction(moment, "toggle-featured")} className={`text-[10px] uppercase tracking-[0.5px] px-2.5 py-2 rounded-lg border cursor-pointer ${moment.featured ? "bg-[#fff4df] border-[#ead1a3] text-[#9a681f]" : "border-[#e5e0d8] text-[#8a8178]"}`}>{moment.featured ? "★ Destacada" : "☆ Destacar"}</button>
                        <button onClick={() => void handleMomentAction(moment, moment.status === "hidden" ? "restore" : "hide")} className="text-[10px] uppercase tracking-[0.5px] px-2.5 py-2 rounded-lg border border-[#e5e0d8] text-[#8a8178] cursor-pointer">{moment.status === "hidden" ? "👁 Restaurar" : "🙈 Ocultar"}</button>
                        <button onClick={() => void handleDeleteMoment(moment)} className="text-[10px] uppercase tracking-[0.5px] px-2.5 py-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer">🗑️ Eliminar</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedGuest && (() => {
          const response = rsvpByGuestId.get(selectedGuest.id);
          const status = getGuestResponseStatus(selectedGuest);
          const invitationUrl = `${window.location.origin}/?guest=${selectedGuest.id}&token=${selectedGuest.token}`;
          return <div className="fixed inset-0 z-50 bg-[#261914]/45 flex justify-end" onMouseDown={(event) => event.target === event.currentTarget && setSelectedGuestId(null)}>
            <aside className="w-full max-w-md h-full bg-[#FAF8F5] shadow-2xl overflow-y-auto">
              <div className="sticky top-0 z-10 bg-white border-b border-[#e5e0d8] px-6 py-5 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[1.5px] text-[#8a8178]">Ficha del invitado</p><h2 className="text-xl mt-1">{selectedGuest.name}</h2></div><button onClick={() => setSelectedGuestId(null)} className="w-9 h-9 rounded-full border border-[#e5e0d8] bg-white text-xl cursor-pointer">×</button></div>
              <div className="p-6 space-y-5">
                <div className={`rounded-2xl p-5 ${status === "confirmed" ? "bg-[#eaf2e4]" : status === "declined" || status === "expired" ? "bg-[#fff0ed]" : "bg-[#fff5e3]"}`}><p className="text-[10px] uppercase tracking-[1px] opacity-60">Estado actual</p><p className="text-lg mt-1 font-semibold">{status === "confirmed" ? "Asistencia confirmada" : status === "expired" ? "Declinada por vencimiento" : status === "declined" ? "No podrá acompañarnos" : "Pendiente de respuesta"}</p>{response && <p className="text-xs mt-2 opacity-70">{response.attending}</p>}</div>
                <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5 space-y-4"><div><p className="text-[10px] uppercase tracking-[1px] text-[#aaa198]">Teléfono</p><p className="text-sm mt-1">{selectedGuest.phone || "No registrado"}</p></div><div><p className="text-[10px] uppercase tracking-[1px] text-[#aaa198]">Acompañantes</p><p className="text-sm mt-1">{getGuestCompanions(selectedGuest).length ? formatNames(getGuestCompanions(selectedGuest)) : "Invitación individual"}</p></div><div><p className="text-[10px] uppercase tracking-[1px] text-[#aaa198]">Invitación enviada</p><p className="text-sm mt-1">{selectedGuest.invitationSentAt ? new Date(selectedGuest.invitationSentAt).toLocaleString("es-DO") : "Todavía no marcada como enviada"}</p></div>{response?.message && <div><p className="text-[10px] uppercase tracking-[1px] text-[#aaa198]">Mensaje</p><p className="text-sm mt-1 italic leading-relaxed">“{response.message}”</p></div>}</div>
                <div className="bg-white border border-[#e5e0d8] rounded-2xl p-5"><p className="text-[10px] uppercase tracking-[1px] text-[#aaa198]">Enlace personal</p><p className="text-[11px] font-mono break-all text-[#75695f] mt-2">{invitationUrl}</p></div>
                <div className="grid grid-cols-2 gap-2"><button onClick={() => handleCopyLink(selectedGuest, guests.findIndex(g => g.id === selectedGuest.id))} className="border border-[#e5e0d8] bg-white rounded-xl py-3 text-xs cursor-pointer">Copiar enlace</button><a href={getWhatsAppUrl(selectedGuest)} target="_blank" rel="noopener noreferrer" onClick={() => void updateGuestStatus(selectedGuest, "mark-invitation-sent")} className="bg-[#7A8468] text-white rounded-xl py-3 text-xs text-center">Abrir WhatsApp</a><button onClick={() => { handleEditGuest(selectedGuest); setSelectedGuestId(null); }} className="border border-[#C7A27C] text-[#8b6747] bg-white rounded-xl py-3 text-xs cursor-pointer">Editar datos</button><button onClick={() => { setSelectedGuestId(null); void handleDeleteGuest(selectedGuest.id, selectedGuest.name); }} className="border border-red-100 text-red-500 bg-white rounded-xl py-3 text-xs cursor-pointer">Eliminar</button></div>
              </div>
            </aside>
          </div>;
        })()}
      </main>
      </div>
    </div>
  );
}
