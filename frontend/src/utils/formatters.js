export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function formatStatus(status) {
  if (!status) return "-";
  return status.replaceAll("_", " ");
}