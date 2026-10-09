import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { SCALE_OPTIONS } from "../../utils/constants";

export default function RiskForm({ initialValues, categories, onSubmit, submitLabel = "Guardar" }) {
  const [values, setValues] = useState({
    title: initialValues?.title || "",
    description: initialValues?.description || "",
    category_id: initialValues?.category_id || "",
    probability: initialValues?.probability || "",
    impact: initialValues?.impact || "",
  });
  const [error, setError] = useState(null);

  function update(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!values.title || !values.category_id) {
      setError("El titulo y la categoria son obligatorios.");
      return;
    }
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
    }
  }

  return (
    <form className="app-form" onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <label>
        Titulo
        <input value={values.title} onChange={(e) => update("title", e.target.value)} />
      </label>

      <label>
        Descripcion
        <textarea value={values.description} onChange={(e) => update("description", e.target.value)} />
      </label>

      <label>
        Categoria
        <select value={values.category_id} onChange={(e) => update("category_id", e.target.value)}>
          <option value="">Seleccione una categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>

      <div className="form-row">
        <label>
          Probabilidad
          <select value={values.probability} onChange={(e) => update("probability", e.target.value)}>
            <option value="">-</option>
            {SCALE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <label>
          Impacto
          <select value={values.impact} onChange={(e) => update("impact", e.target.value)}>
            <option value="">-</option>
            {SCALE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="primary-button">{submitLabel}</button>
    </form>
  );
}