import { Outlet } from "react-router-dom";
import { ShieldCheck, ShieldAlert, BarChart3, ClipboardCheck } from "lucide-react";

export default function AuthLayout() {
  return (
    <main className="auth-layout">
      <div className="auth-shell">
        <section className="auth-hero" aria-label="RiskOps, gestión de riesgos">
          <div className="auth-brand"><ShieldCheck size={34} strokeWidth={1.8} aria-hidden="true" /> RiskOps</div>
          <div className="auth-hero-content">
            <span className="auth-eyebrow">GESTIÓN INTEGRAL DE RIESGOS</span>
            <h1>Anticipa los riesgos.<br />Protege lo que importa.</h1>
            <p>La información que necesitas para evaluar riesgos, coordinar mitigaciones y tomar mejores decisiones.</p>
            <div className="auth-features">
              <span><ShieldAlert size={19} aria-hidden="true" /> Identifica y evalúa tus riesgos</span>
              <span><ClipboardCheck size={19} aria-hidden="true" /> Da seguimiento a tus planes</span>
              <span><BarChart3 size={19} aria-hidden="true" /> Transforma datos en decisiones</span>
            </div>
          </div>
          <div className="auth-hero-footer"><ShieldCheck size={17} aria-hidden="true" /> Claridad para decidir. Control para avanzar.</div>
        </section>
        <section className="auth-card"><Outlet /></section>
      </div>
    </main>
  );
}
