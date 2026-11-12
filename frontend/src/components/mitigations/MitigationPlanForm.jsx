import { useState } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";

export default function MitigationPlanForm({ users, onSubmit, submitLabel = "Crear plan" }) {
  const [values, setValues] = useState({
    title: "", description: "", responsible_user_id: "", start_date: "", due_date: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!values.title || !values.responsible_user_id || !values.start_date || !values.due_date) {
      setError("Todos los campos, excepto la descripcion, son obligatorios.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description || null,
        responsible_user_id: Number(values.responsible_user_id),
        start_date: values.start_date,
        due_date: values.due_date,
      });
      setValues({ title: "", description: "", responsible_user_id: "", start_date: "", due_date: "" });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el plan de mitigacion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="app-form mitigation-plan-form" onSubmit={handleSubmit} aria-busy={submitting}>
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <label>
        Título
        <input value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="Nombre del plan de mitigación" />
      </label>

      <label>
        Descripción
        <textarea value={values.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe las medidas que se implementarán" rows={3} />
      </label>

      <label>
        Responsable
        <select value={values.responsible_user_id} onChange={(e) => update("responsible_user_id", e.target.value)}>
          <option value="">Seleccione un responsable</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </label>

      <div className="form-row">
        <label>
          Fecha de inicio
          <input type="date" value={values.start_date} onChange={(e) => update("start_date", e.target.value)} />
        </label>
        <label>
          Fecha límite
          <input type="date" value={values.due_date} onChange={(e) => update("due_date", e.target.value)} />
        </label>
      </div>

      <div className="form-actions"><button type="submit" className="primary-button button-with-icon" disabled={submitting}>{submitting ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}{submitting ? "Guardando..." : submitLabel}</button></div>
    </form>
  );
}
