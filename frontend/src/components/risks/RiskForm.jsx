import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Save, ShieldCheck, Layers3, BarChart3, Crosshair, Info, Loader2 } from "lucide-react";
import { SCALE_OPTIONS } from "../../utils/constants";
import { riskLevelColor, riskLevelLabel } from "../../utils/riskLevelHelper";

export default function RiskForm({ initialValues, categories, onSubmit, submitLabel = "Guardar" }) {
  const [values, setValues] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    category_id: initialValues?.category_id || "",
    probability: initialValues?.probability || "",
    impact: initialValues?.impact || "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const score = values.probability && values.impact ? Number(values.probability) * Number(values.impact) : null;
  const level = score === null ? null : score <= 4 ? "LOW" : score <= 9 ? "MEDIUM" : score <= 16 ? "HIGH" : "CRITICAL";
  const category = categories.find((item) => String(item.id) === String(values.category_id));

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!values.title || !values.category_id) {
      setError("El título y la categoría son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description || null,
        category_id: Number(values.category_id),
        probability: values.probability ? Number(values.probability) : null,
        impact: values.impact ? Number(values.impact) : null,
      });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo guardar el riesgo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="app-form card risk-form" onSubmit={handleSubmit} aria-busy={saving}>
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="risk-form-layout">
        <div className="risk-form-fields">
          <div className="section-heading">
            <h3>Información del riesgo</h3>
            <p>Completa los datos principales. Los campos con <span className="required-marker">*</span> son obligatorios.</p>
          </div>
          <label>
            <span>Título <span className="required-marker">*</span></span>
            <input value={values.title} onChange={(e) => update("title", e.target.value)} placeholder="Ingresa un título descriptivo del riesgo" aria-required="true" aria-invalid={Boolean(error && !values.title)} />
          </label>

          <label>
            Descripción
            <textarea rows={4} value={values.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe el riesgo, su causa y sus posibles consecuencias." />
          </label>

          <label>
            <span>Categoría <span className="required-marker">*</span></span>
            <select value={values.category_id} onChange={(e) => update("category_id", e.target.value)} aria-required="true" aria-invalid={Boolean(error && !values.category_id)}>
              <option value="">Selecciona una categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label>
              Probabilidad
              <select value={values.probability} onChange={(e) => update("probability", e.target.value)}>
                <option value="">Selecciona la probabilidad</option>
                {SCALE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>

            <label>
              Impacto
              <select value={values.impact} onChange={(e) => update("impact", e.target.value)}>
                <option value="">Selecciona el impacto</option>
                {SCALE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <aside className="risk-evaluation-summary" aria-label="Resumen de evaluación" aria-live="polite">
          <div className="summary-heading">
            <span className="section-icon"><ShieldCheck size={26} /></span>
            <div><h3>Resumen de evaluación</h3><p>Resultado de la evaluación inicial del riesgo.</p></div>
          </div>
          <dl className="summary-list">
            <div><dt><Layers3 size={20} />Categoría</dt><dd>{category?.name || "—"}</dd></div>
            <div><dt><BarChart3 size={20} />Probabilidad</dt><dd>{values.probability || "—"}</dd></div>
            <div><dt><Crosshair size={20} />Impacto</dt><dd>{values.impact || "—"}</dd></div>
          </dl>
          <div className="summary-risk-level">
            <strong>Nivel de riesgo</strong>
            <span className="risk-level-badge" style={{ backgroundColor: riskLevelColor(level) }}>{level ? riskLevelLabel(level) : "—"}</span>
          </div>
          {score !== null && <p className="summary-score">Puntuación inicial: <strong>{score} / 25</strong></p>}
          <div className="alert alert-info"><Info size={20} /><span>El nivel se calcula automáticamente según la probabilidad y el impacto seleccionados.</span></div>
        </aside>
      </div>

      <div className="form-actions">
        <Link to="/risks" className="secondary-button">Cancelar</Link>
        <button type="submit" className="primary-button button-with-icon" disabled={saving}>
          {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}{saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
