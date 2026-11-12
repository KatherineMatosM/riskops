import Skeleton from "./Skeleton";
import StatCard from "../dashboard/StatCard";

const items = (count) => Array.from({ length: count }, (_, index) => index);

function HeadingSkeleton() {
  return (
    <div className="page-header skeleton-page-header">
      <div className="page-heading">
        <Skeleton className="skeleton-heading-icon" />
        <div className="skeleton-heading-copy">
          <Skeleton width="58%" height={30} />
          <Skeleton width="88%" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ children, className = "" }) {
  return (
    <div className={`card skeleton-card ${className}`}>
      <div className="card-header">
        <div className="skeleton-stack">
          <Skeleton width="52%" height={18} />
          <Skeleton width="78%" height={12} />
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function StatsSkeleton({ count = 3, className = "" }) {
  return (
    <div className={`stats-grid ${className}`}>
      {items(count).map((index) => <StatCard key={index} loading />)}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-head" style={{ "--skeleton-columns": columns }}>
        {items(columns).map((column) => <Skeleton key={column} width="65%" height={11} />)}
      </div>
      {items(rows).map((row) => (
        <div className="skeleton-table-row" key={row} style={{ "--skeleton-columns": columns }}>
          {items(columns).map((column) => (
            <Skeleton key={column} width={`${column === 0 ? 78 : 55 + ((row + column) % 3) * 12}%`} height={13} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div className="skeleton-list">
      {items(rows).map((index) => (
        <div key={index} className="skeleton-list-item">
          <Skeleton className="skeleton-list-icon" />
          <div className="skeleton-stack">
            <Skeleton width="48%" />
            <Skeleton width="90%" height={12} />
            <Skeleton width="30%" height={10} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldSkeleton({ multiline = false }) {
  return (
    <div className="skeleton-field">
      <Skeleton width="32%" height={12} />
      <Skeleton height={multiline ? 110 : 44} className="skeleton-input" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="app-form card risk-form">
      <div className="risk-form-layout">
        <div className="risk-form-fields">
          <div className="skeleton-stack skeleton-section-heading">
            <Skeleton width="52%" height={19} />
            <Skeleton width="88%" height={12} />
          </div>
          <FieldSkeleton />
          <FieldSkeleton multiline />
          <FieldSkeleton />
          <div className="form-row"><FieldSkeleton /><FieldSkeleton /></div>
        </div>
        <div className="risk-evaluation-summary skeleton-summary">
          <div className="summary-heading">
            <Skeleton width={43} height={43} className="skeleton-tile" />
            <div className="skeleton-stack"><Skeleton width="85%" height={18} /><Skeleton width="95%" height={12} /></div>
          </div>
          {items(3).map((index) => (
            <div className="skeleton-summary-row" key={index}><Skeleton width="50%" /><Skeleton width="14%" /></div>
          ))}
          <Skeleton height={61} className="skeleton-summary-level" />
          <Skeleton height={70} />
        </div>
      </div>
      <div className="form-actions"><Skeleton width={90} height={43} /><Skeleton width={150} height={43} /></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <StatsSkeleton count={4} className="dashboard-summary" />
      <StatsSkeleton count={5} className="dashboard-secondary-stats" />
      <div className="charts-grid dashboard-charts">
        <SectionSkeleton><div className="skeleton-donut-layout"><Skeleton className="skeleton-donut" /><ListSkeleton rows={4} /></div></SectionSkeleton>
        <SectionSkeleton><div className="skeleton-chart-bars">{items(5).map((index) => <div className="skeleton-stack" key={index}><Skeleton width="40%" height={11} /><Skeleton height={8} /></div>)}</div></SectionSkeleton>
        <SectionSkeleton><Skeleton height={260} /></SectionSkeleton>
        <SectionSkeleton><Skeleton height={260} /></SectionSkeleton>
        <SectionSkeleton className="chart-wide"><Skeleton height={240} /></SectionSkeleton>
      </div>
    </>
  );
}

export function AnalyticsSkeleton() {
  return (
    <>
      <StatsSkeleton />
      <div className="analytics-grid">
        {items(4).map((index) => <SectionSkeleton key={index}><ListSkeleton rows={index < 2 ? 3 : 2} /></SectionSkeleton>)}
      </div>
    </>
  );
}

export function UsersSkeleton() {
  return <><StatsSkeleton /><SectionSkeleton><TableSkeleton rows={4} columns={4} /></SectionSkeleton></>;
}

export function MatrixSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <StatsSkeleton />
      <div className="card matrix-layout">
        <div className="matrix-visual">
          <div className="skeleton-matrix-grid">{items(25).map((index) => <Skeleton key={index} />)}</div>
          <Skeleton width="30%" className="skeleton-axis" />
        </div>
        <div className="skeleton-stack">
          <Skeleton width="75%" height={20} />
          <ListSkeleton rows={4} />
          <Skeleton height={74} />
        </div>
      </div>
    </>
  );
}

export function DetailSkeleton() {
  return (
    <>
      <Skeleton width={130} height={14} className="skeleton-back-link" />
      <HeadingSkeleton />
      <StatsSkeleton />
      <div className="detail-grid">
        <SectionSkeleton><div className="skeleton-stack"><Skeleton /><Skeleton width="92%" /><Skeleton width="70%" /><Skeleton height={78} /></div></SectionSkeleton>
        <SectionSkeleton><ListSkeleton rows={2} /></SectionSkeleton>
      </div>
      <SectionSkeleton><TableSkeleton rows={3} /></SectionSkeleton>
    </>
  );
}

export function MitigationsSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <SectionSkeleton><TableSkeleton rows={4} /></SectionSkeleton>
      <SectionSkeleton>
        <div className="mitigation-plan-form"><FieldSkeleton /><FieldSkeleton multiline /><FieldSkeleton /><div className="form-row"><FieldSkeleton /><FieldSkeleton /></div></div>
      </SectionSkeleton>
    </>
  );
}

export function ShellSkeleton() {
  return (
    <div className="main-layout skeleton-shell">
      <div className="sidebar skeleton-shell-sidebar">
        <div className="sidebar-brand"><Skeleton height={29} className="skeleton-brand" /></div>
        <div className="sidebar-nav">{items(7).map((index) => <Skeleton key={index} height={40} />)}</div>
      </div>
      <div className="main-content">
        <div className="navbar"><div className="navbar-spacer" /><Skeleton width={36} height={36} className="skeleton-circle" /><Skeleton width={160} /></div>
        <div className="page-container"><HeadingSkeleton /><DashboardSkeleton /></div>
      </div>
    </div>
  );
}
