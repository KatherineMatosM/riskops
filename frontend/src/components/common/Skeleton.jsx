export default function Skeleton({ width, height, className = "" }) {
  return <span className={`skeleton ${className}`} style={{ width, height }} aria-hidden="true" />;
}
