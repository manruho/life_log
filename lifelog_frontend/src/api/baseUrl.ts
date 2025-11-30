const fallbackBase = (() => {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const port = import.meta.env.VITE_API_PORT || "5000";
    return `${protocol}//${hostname}:${port}`;
  }

  return "http://localhost:5000";
})();

export const API_BASE = fallbackBase;
