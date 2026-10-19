const CACHE_PREFIX = "petit-cahier:list:";

/** Last successful list for a space, so a refresh shows your data right away. */
export function readListCache<T>(resource: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + resource);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeListCache(resource: string, data: unknown) {
  try { window.localStorage.setItem(CACHE_PREFIX + resource, JSON.stringify(data)); } catch {}
}

export async function studyRequest<T>(resource: string, method = "GET", data?: unknown): Promise<T> {
  const res = await fetch(`/api/study/${resource}`, {
    method, cache: "no-store", ...(data === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Le service est indisponible. Réessaie.");
  if (method === "GET") writeListCache(resource, body);
  else window.dispatchEvent(new Event("cahier:activity"));
  return body as T;
}
export function tellLina(message: string) {
  window.dispatchEvent(new CustomEvent("lina:message", { detail: message }));
}
