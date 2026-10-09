import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Risks from "../pages/Risks";
import RiskNew from "../pages/RiskNew";
import RiskDetail from "../pages/RiskDetail";
import RiskEdit from "../pages/RiskEdit";
import RiskMatrix from "../pages/RiskMatrix";
import Mitigations from "../pages/Mitigations";
import Reports from "../pages/Reports";
import Analytics from "../pages/Analytics";
import Notifications from "../pages/Notifications";
import Users from "../pages/Users";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import { ROLES } from "../utils/constants";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/risks" element={<Risks />} />
          <Route
            path="/risks/new"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST]}>
                <RiskNew />
              </ProtectedRoute>
            }
          />
          <Route path="/risks/:riskId" element={<RiskDetail />} />
          <Route
            path="/risks/:riskId/edit"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST]}>
                <RiskEdit />
              </ProtectedRoute>
            }
          />
          <Route path="/risk-matrix" element={<RiskMatrix />} />
          <Route path="/mitigations" element={<Mitigations />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RISK_MANAGER]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}