import { Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title"><ShieldCheck size={24} /> RiskOps</h1>
        <Outlet />
      </div>
    </div>
  );
}