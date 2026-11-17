export function getErrorMessage(error, fallback) {
  const message = error?.response?.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function getFieldErrors(error, allowedFields) {
  const details = error?.response?.data?.errors;
  if (!Array.isArray(details)) return {};
  const allowed = new Set(allowedFields);
  return details.reduce((fields, detail) => {
    if (allowed.has(detail?.field) && typeof detail.message === "string" && detail.message.trim() && !fields[detail.field]) {
      fields[detail.field] = detail.message;
    }
    return fields;
  }, {});
}
