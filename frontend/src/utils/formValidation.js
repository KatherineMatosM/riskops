export function getValidationMessage(input) {
  const validity = input.validity;
  if (!validity || validity.valid) return "";
  if (validity.valueMissing) return "Este campo es obligatorio.";
  if (validity.typeMismatch && input.type === "email") return "Ingresa un correo electrónico válido.";
  if (validity.typeMismatch || validity.badInput) return "Ingresa un valor válido.";
  if (validity.tooShort) return `Usa al menos ${input.minLength} caracteres.`;
  if (validity.tooLong) return `Usa como máximo ${input.maxLength} caracteres.`;
  if (validity.rangeUnderflow) return `El valor mínimo es ${input.min}.`;
  if (validity.rangeOverflow) return `El valor máximo es ${input.max}.`;
  if (validity.patternMismatch) return "Revisa el formato de este campo.";
  return input.validationMessage || "Revisa el valor de este campo.";
}
