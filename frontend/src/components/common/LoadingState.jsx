import {
  AnalyticsSkeleton, DashboardSkeleton, DetailSkeleton, FormSkeleton,
  ListSkeleton, MatrixSkeleton, MitigationsSkeleton, ShellSkeleton,
  TableSkeleton, UsersSkeleton,
} from "./SkeletonLayouts";

const LAYOUTS = {
  analytics: AnalyticsSkeleton,
  dashboard: DashboardSkeleton,
  detail: DetailSkeleton,
  form: FormSkeleton,
  list: ListSkeleton,
  matrix: MatrixSkeleton,
  mitigations: MitigationsSkeleton,
  shell: ShellSkeleton,
  table: TableSkeleton,
  users: UsersSkeleton,
};

export default function LoadingState({ label = "Cargando información...", variant = "table", rows, columns }) {
  const Layout = LAYOUTS[variant] || TableSkeleton;

  return (
    <div className={`loading-state skeleton-state skeleton-state-${variant}`} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" aria-busy="true"><Layout rows={rows} columns={columns} /></div>
    </div>
  );
}
