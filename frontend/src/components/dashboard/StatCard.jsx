import Skeleton from "../common/Skeleton";

export default function StatCard({ label, value, accent, icon: Icon, loading = false }) {
  return (
    <div className={`stat-card${loading ? " skeleton-stat" : ""}`} style={accent ? { "--stat-accent": accent } : undefined} aria-busy={loading || undefined}>
      {loading ? <Skeleton className="skeleton-stat-icon" /> : Icon && <span className="stat-card-icon"><Icon size={26} strokeWidth={1.8} aria-hidden="true" /></span>}
      <div className="stat-card-copy">
        {loading ? <><Skeleton width="82%" height={12} /><Skeleton width={52} height={32} /></> : <><span className="stat-card-label">{label}</span><span className="stat-card-value">{value}</span></>}
      </div>
      {loading && label && <span className="sr-only">Cargando {label.toLowerCase()}...</span>}
    </div>
  );
}
