import { Navigate } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, roles }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <LoadingState variant="shell" label="Cargando RiskOps..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
