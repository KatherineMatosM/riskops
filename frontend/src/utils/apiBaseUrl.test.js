import { normalizeApiBaseUrl } from "./apiBaseUrl";

describe("normalizeApiBaseUrl", () => {
  test.each([
    [undefined],
    [null],
    [""],
    ["   "],
  ])("uses the existing development default for %p", (configuredBaseUrl) => {
    expect(normalizeApiBaseUrl(configuredBaseUrl)).toBe(
      "http://localhost:8000/api/v1"
    );
  });

  test.each([
    ["http://localhost:8000", "http://localhost:8000/api/v1"],
    ["http://localhost:8000/", "http://localhost:8000/api/v1"],
    ["https://api.example.com", "https://api.example.com/api/v1"],
    ["https://api.example.com/", "https://api.example.com/api/v1"],
    ["http://[::1]:8000", "http://[::1]:8000/api/v1"],
    ["http://[::1]:8000/", "http://[::1]:8000/api/v1"],
    ["  http://localhost:8000/  ", "http://localhost:8000/api/v1"],
  ])("adds the API prefix to the HTTP origin %s", (value, expected) => {
    expect(normalizeApiBaseUrl(value)).toBe(expected);
  });

  test.each([
    ["http://localhost:8000/api/v1", "http://localhost:8000/api/v1"],
    ["http://localhost:8000/api/v1/", "http://localhost:8000/api/v1"],
    ["https://api.example.com/custom/api/", "https://api.example.com/custom/api"],
    ["https://api.example.com/custom/api///", "https://api.example.com/custom/api"],
    ["/api/v1", "/api/v1"],
    [" /api/v1/ ", "/api/v1"],
    ["/custom/api/", "/custom/api"],
  ])("preserves the configured API path in %s", (value, expected) => {
    expect(normalizeApiBaseUrl(value)).toBe(expected);
  });

  test.each([
    ["https://api.example.com/?version=1", "https://api.example.com?version=1"],
    ["https://api.example.com/#gateway", "https://api.example.com#gateway"],
    [
      "https://api.example.com/custom/api/?next=/path/#gateway",
      "https://api.example.com/custom/api?next=/path/#gateway",
    ],
    ["/api/v1/?version=1", "/api/v1?version=1"],
  ])("preserves query and hash suffixes in %s", (value, expected) => {
    expect(normalizeApiBaseUrl(value)).toBe(expected);
  });
});
