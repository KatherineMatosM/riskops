import RiskLevelBadge from "../common/RiskLevelBadge";

export default function RiskCard({ risk }) {
  return (
    <article className="risk-card">
      <div className="risk-card-header">
        <h3>{risk.title}</h3>
        <RiskLevelBadge level={risk.risk_level} />
      </div>
      <p>{risk.description || "Sin descripción registrada."}</p>
    </article>
  );
}
