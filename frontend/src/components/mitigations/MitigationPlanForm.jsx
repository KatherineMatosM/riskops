import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import FieldError from "../common/FieldError";
import { getErrorMessage, getFieldErrors } from "../../utils/apiErrors";

export default function MitigationPlanForm({ users, onSubmit, submitLabel = "Crear plan", usersLoading = false }) {
  const [values, setValues] = useState({
    title: "", description: "", responsible_user_id: "", start_date: "", due_date: "",
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const formId = useId();
  const fieldRefs = useRef({});
  const fieldToFocus = useRef(null);

  useEffect(() => {
    if (fieldToFocus.current) {
      fieldRefs.current[fieldToFocus.current]?.focus();
      fieldToFocus.current = null;
    }
  }, [fieldErrors]);

  function fieldProps(field) {
    return {
      id: `${formId}-${field}`,
      name: field,
      ref: (node) => { fieldRefs.current[field] = node; },
      "aria-required": true,
      "aria-invalid": Boolean(fieldErrors[field]),
      "aria-describedby": fieldErrors[field] ? `${formId}-${field}-error` : undefined,
    };
  }

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const nextErrors = {};
    if (!values.title) nextErrors.title = "Ingresa un título para el plan.";
    if (!values.responsible_user_id) nextErrors.responsible_user_id = "Selecciona un responsable.";
    if (!values.start_date) nextErrors.start_date = "Selecciona la fecha de inicio.";
    if (!values.due_date) nextErrors.due_date = "Selecciona la fecha límite.";
    if (values.start_date && values.due_date && values.due_date < values.start_date) nextErrors.due_date = "La fecha límite debe ser igual o posterior a la fecha de inicio.";
    const invalidFields = Object.keys(nextErrors);
    fieldToFocus.current = invalidFields[0] || null;
    setFieldErrors(nextErrors);
    if (invalidFields.length) {
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
      const serverErrors = getFieldErrors(err, ["title", "responsible_user_id", "start_date", "due_date"]);
      fieldToFocus.current = Object.keys(serverErrors)[0] || null;
      setFieldErrors(serverErrors);
      setError(getErrorMessage(err, "No se pudo crear el plan de mitigación."));
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

      <div className="form-field">
        <label htmlFor={`${formId}-title`}>
          Título
          <input {...fieldProps("title")} value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="Nombre del plan de mitigación" />
        </label>
        <FieldError id={`${formId}-title-error`}>{fieldErrors.title}</FieldError>
      </div>

      <label>
        Descripción
        <textarea value={values.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe las medidas que se implementarán" rows={3} />
      </label>

      <div className="form-field">
        <label htmlFor={`${formId}-responsible_user_id`}>
          Responsable
          <select {...fieldProps("responsible_user_id")} disabled={usersLoading} value={values.responsible_user_id} onChange={(e) => update("responsible_user_id", e.target.value)}>
            <option value="">{usersLoading ? "Cargando responsables..." : "Seleccione un responsable"}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </label>
        <FieldError id={`${formId}-responsible_user_id-error`}>{fieldErrors.responsible_user_id}</FieldError>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${formId}-start_date`}>
            Fecha de inicio
            <input {...fieldProps("start_date")} type="date" value={values.start_date} onChange={(e) => update("start_date", e.target.value)} />
          </label>
          <FieldError id={`${formId}-start_date-error`}>{fieldErrors.start_date}</FieldError>
        </div>
        <div className="form-field">
          <label htmlFor={`${formId}-due_date`}>
            Fecha límite
            <input {...fieldProps("due_date")} type="date" value={values.due_date} onChange={(e) => update("due_date", e.target.value)} />
          </label>
          <FieldError id={`${formId}-due_date-error`}>{fieldErrors.due_date}</FieldError>
        </div>
      </div>

      <div className="form-actions"><button type="submit" className="primary-button button-with-icon" disabled={submitting || usersLoading}>{submitting ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}{submitting ? "Guardando..." : submitLabel}</button></div>
    </form>
  );
}
