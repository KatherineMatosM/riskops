export default function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <div className="stat-card" style={accent ? { borderTopColor: accent } : undefined}>
      {Icon && <Icon size={18} className="stat-card-icon" style={accent ? { color: accent } : undefined} />}
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
    </div>
  );
}