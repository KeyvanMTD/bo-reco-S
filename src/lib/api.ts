const API_BASE = import.meta.env.VITE_API_BASE as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

type HttpMethod = 'GET' | 'POST';

export class HttpError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: { method?: HttpMethod; query?: Record<string, string | number | boolean | undefined>; body?: unknown; signal?: AbortSignal }
): Promise<T> {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
  const { method = 'GET', query, body, signal } = options || {};
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    signal,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status}`, res.status, data);
  }

  return data as T;
}

export const Api = {
  health: () => apiFetch<{ status: string; db?: string; last_run?: unknown }>(`/health`),
  runs: (params: { tenant: string; type?: string; limit?: number }) =>
    apiFetch<Array<{ id: string; tenant: string; type: string; status: string; counts?: unknown; started_at: string; ended_at?: string }>>(
      `/runs`, { query: params }
    ),
  ingestStart: (payload: { tenant: string; feed_url: string; feed_type: string; batch_size?: number; dry_run?: boolean }) =>
    apiFetch<{ ok: boolean; run: { id: string; status: string; counts?: unknown } }>(`/ingest/start`, { method: 'POST', body: payload }),
  recommendations: (params: { tenant: string; product_id: string; kind?: string; limit?: number }) =>
    apiFetch<{ items: Array<{ product_id: string; score: number; meta?: unknown }> }>(`/recommendations`, { query: params }),
  recommendationsRefresh: (payload: { tenant: string; product_id: string; kind?: string; limit?: number }) =>
    apiFetch<{ items: unknown[]; cached_at?: string; rules?: unknown }>(`/recommendations/refresh`, { method: 'POST', body: payload }),
  recommendationsPreview: (params: { tenant: string; product_id: string; kind?: string; limit?: number }) =>
    apiFetch<{ product_id: string; kind: string; rules?: unknown; items: Array<{ product_id: string; score: number }> }>(`/recommendations/preview`, { query: params }),
};

export const DEFAULT_TENANT = (import.meta.env.VITE_DEFAULT_TENANT as string) || '';

