export function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function isInScale(value) {
  const num = Number(value);
  return num >= 1 && num <= 5;
}

export function isValidProgress(value) {
  const num = Number(value);
  return num >= 0 && num <= 100;
}