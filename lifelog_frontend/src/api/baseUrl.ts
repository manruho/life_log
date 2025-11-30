const resolveBase = () => {
  const explicit = import.meta.env.VITE_API_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    const apiPort = import.meta.env.VITE_API_PORT || "5000";
    // 同一ポートで配信されていればそのまま、Vite開発時は5000をデフォルト
    const targetPort = port && port !== "80" && port !== "443" ? apiPort : apiPort;
    return `${protocol}//${hostname}:${targetPort}`;
  }

  return "http://localhost:5000";
};

export const API_BASE = resolveBase();
