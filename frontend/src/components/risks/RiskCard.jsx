import { riskLevelColor, riskLevelLabel } from "../../utils/riskLevelHelper";

export default function RiskCard({ risk }) {
  return (
    <div className="risk-card">
      <div className="risk-card-header">
        <h4>{risk.title}</h4>
        <span className="risk-level-badge" style={{ backgroundColor: riskLevelColor(risk.risk_level) }}>
          {riskLevelLabel(risk.risk_level)}
        </span>
      </div>
      <p>{risk.description}</p>
    </div>
  );
}