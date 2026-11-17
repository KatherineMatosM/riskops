import { getErrorMessage, getFieldErrors } from "./apiErrors";

test("only supported field errors with text are exposed by a form", () => {
  const error = { response: { data: { errors: [
    { field: "email", message: "Correo inválido." }, { field: "email", message: "Segundo mensaje." },
    { field: "unknown", message: "No corresponde al formulario." }, { field: "password", message: { internal: true } },
  ] } } };
  expect(getFieldErrors(error, ["email", "password"])).toEqual({ email: "Correo inválido." });
});

test("malformed error payloads never become React children or throw", () => {
  expect(getErrorMessage({ response: { data: { message: { detail: "bad" } } } }, "Error visible.")).toBe("Error visible.");
  expect(getFieldErrors({}, ["title"])).toEqual({});
  expect(getErrorMessage(null, "Sin conexión.")).toBe("Sin conexión.");
});
