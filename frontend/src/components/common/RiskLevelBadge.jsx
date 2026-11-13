import { Shield, ShieldAlert } from "lucide-react";
import { riskLevelLabel } from "../../utils/riskLevelHelper";

const VARIANTS = { LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };

export default function RiskLevelBadge({ level, emptyLabel = "Sin evaluar" }) {
  const variant = VARIANTS[level] || "unassessed";
  const Icon = level === "CRITICAL" || level === "HIGH" ? ShieldAlert : Shield;

  return (
    <span className={`risk-level-badge risk-level-${variant}`}>
      {variant !== "unassessed" && <Icon size={13} aria-hidden="true" />}
      {variant === "unassessed" ? emptyLabel : riskLevelLabel(level)}
    </span>
  );
}
