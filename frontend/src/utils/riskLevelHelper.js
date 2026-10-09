export function riskLevelColor(level) {
  switch (level) {
    case "LOW": return "#2e7d32";
    case "MEDIUM": return "#f9a825";
    case "HIGH": return "#ef6c00";
    case "CRITICAL": return "#c62828";
    default: return "#9e9e9e";
  }
}

export function riskLevelLabel(level) {
  const labels = { LOW: "Bajo", MEDIUM: "Medio", HIGH: "Alto", CRITICAL: "Critico" };
  return labels[level] || "Sin evaluar";
}