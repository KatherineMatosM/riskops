const LOCALE = "es-DO";
const DATE_OPTIONS = { day: "2-digit", month: "2-digit", year: "numeric" };
const TIME_OPTIONS = { hour: "2-digit", minute: "2-digit", hour12: false };
const dateFormatter = new Intl.DateTimeFormat(LOCALE, DATE_OPTIONS);
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { ...DATE_OPTIONS, ...TIME_OPTIONS });
const calendarFormatter = new Intl.DateTimeFormat(LOCALE, { ...DATE_OPTIONS, timeZone: "UTC" });
const calendarTimeFormatter = new Intl.DateTimeFormat(LOCALE, { ...DATE_OPTIONS, ...TIME_OPTIONS, timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" });

const STATUS_LABELS = {
  IDENTIFIED: "Identificado",
  ASSESSED: "Evaluado",
  MITIGATION_IN_PROGRESS: "En mitigación",
  MONITORED: "En seguimiento",
  CLOSED: "Cerrado",
  PLANNED: "Planificado",
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  OVERDUE: "Atrasado",
};

const ROLE_LABELS = {
  ADMIN: "Administrador",
  RISK_MANAGER: "Gestor de riesgos",
  ANALYST: "Analista",
  VIEWER: "Consulta",
};

function parseDate(value) {
  if (!value) return null;
  const calendarOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  // Calendar dates have no timezone; keep their day while leaving timestamps' interpretation unchanged.
  const date = new Date(calendarOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime()) || (calendarOnly && date.toISOString().slice(0, 10) !== value)) return null;
  return { date, calendarOnly };
}

function formatEnum(value, labels) {
  const text = String(value ?? "").trim();
  if (!text) return "-";
  if (labels[text.toUpperCase()]) return labels[text.toUpperCase()];
  const readable = text.replaceAll("_", " ").toLocaleLowerCase(LOCALE);
  return readable.charAt(0).toLocaleUpperCase(LOCALE) + readable.slice(1);
}

export function formatDate(value) {
  const parsed = parseDate(value);
  if (!parsed) return "-";
  return (parsed.calendarOnly ? calendarFormatter : dateFormatter).format(parsed.date);
}

export function formatDateTime(value) {
  const parsed = parseDate(value);
  if (!parsed) return "-";
  return (parsed.calendarOnly ? calendarTimeFormatter : dateTimeFormatter).format(parsed.date);
}

export function formatMonth(value) {
  if (!value) return "-";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return String(value);
  return monthFormatter.format(new Date(`${value}-01T00:00:00Z`));
}

export function formatStatus(status) {
  return formatEnum(status, STATUS_LABELS);
}

export function formatRole(role) {
  return formatEnum(role, ROLE_LABELS);
}
