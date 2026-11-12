import { riskLevelColor, riskLevelLabel } from "../../utils/riskLevelHelper";
import { ShieldAlert } from "lucide-react";

export default function RiskCard({ risk }) {
  return (
    <article className="risk-card">
      <div className="risk-card-header">
        <h3>{risk.title}</h3>
        <span className="risk-level-badge" style={{ backgroundColor: riskLevelColor(risk.risk_level) }}>
          <ShieldAlert size={14} aria-hidden="true" />
          {riskLevelLabel(risk.risk_level)}
        </span>
      </div>
      <p>{risk.description || "Sin descripción registrada."}</p>
    </article>
  );
}
