const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export function normalizeApiBaseUrl(configuredBaseUrl) {
  const baseUrl = configuredBaseUrl?.trim() || DEFAULT_API_BASE_URL;
  const suffixIndex = baseUrl.search(/[?#]/);
  const path = suffixIndex === -1 ? baseUrl : baseUrl.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : baseUrl.slice(suffixIndex);
  const normalizedPath = path.replace(/\/+$/, "") || "/";

  if (/^https?:\/\//i.test(baseUrl) && suffixIndex === -1) {
    try {
      if (new URL(baseUrl).pathname === "/") {
        return `${normalizedPath}/api/v1`;
      }
    } catch {
      // Leave invalid configuration for the HTTP client to report.
    }
  }

  return `${normalizedPath}${suffix}`;
}
