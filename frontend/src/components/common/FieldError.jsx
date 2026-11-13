export default function FieldError({ id, children }) {
  if (!children) return null;
  return <span id={id} className="field-error">{children}</span>;
}
