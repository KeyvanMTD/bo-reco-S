// Utilitaire pour récupérer des attributs IA depuis le webhook n8n
// - Cache mémoire 10 minutes par couple (tenant, productId)
// - Timeout 8s
// - Parsing robuste et gestion d'erreurs

export type AiAttribute = {
  key: string;
  value: string | number | boolean | null;
  definition?: string;
};

export type FetchAiAttributesResult = {
  ok: boolean;
  attributes?: AiAttribute[];
  count?: number;
  error?: string;
};

const AI_ATTRS_URL_DEFAULT = 'https://n8n.srv799877.hstgr.cloud/webhook/ai_attrs_preview';
const AI_ATTRS_URL = (import.meta as any)?.env?.VITE_AI_ATTRS_URL || AI_ATTRS_URL_DEFAULT;

// Cache simple en mémoire (clé: `${tenant}::${productId}`)
const cache = new Map<string, { expiresAt: number; data: FetchAiAttributesResult }>();
const TEN_MINUTES_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8_000;

function getCacheKey(productId: string, tenant: string): string {
  return `${tenant}::${productId}`;
}

export async function fetchAiAttributes(productId: string, tenant: string): Promise<FetchAiAttributesResult> {
  try {
    if (!productId || !tenant) return { ok: false, error: 'Paramètres manquants' };

    const key = getCacheKey(productId, tenant);
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(AI_ATTRS_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ product_id: productId, tenant }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    // Tentative de parsing robuste (text/plain ou stringifié plusieurs fois)
    const text = await res.text();
    let raw: any = text;
    const tryParse = (t: any) => {
      if (typeof t !== 'string') return t;
      try { return JSON.parse(t); } catch { return t; }
    };
    raw = tryParse(raw);
    // parfois la réponse est une string JSON imbriquée
    if (typeof raw === 'string') raw = tryParse(raw);
    // certains webhooks renvoient plusieurs blobs JSON concaténés en text/plain
    if (typeof raw === 'string') {
      const matches = raw.match(/\{[\s\S]*?\}/g);
      if (matches && matches.length > 0) {
        // on prend le dernier bloc qui contient souvent les données finales
        const last = matches[matches.length - 1];
        const parsed = tryParse(last);
        if (parsed && typeof parsed === 'object') raw = parsed;
      }
    }

    // Unwrap structures n8n atypiques
    const unwrap = (v: any): any => {
      if (Array.isArray(v)) return v.length ? unwrap(v[0]) : v;
      if (v && typeof v === 'object') {
        if ('=' in v) return unwrap(v['=']);
        if ('object Object' in v) return unwrap(v['object Object']);
        if ('json' in v && typeof v.json === 'object') return unwrap(v.json);
        return v;
      }
      return v;
    };
    const json: any = unwrap(raw);

    // Recherche profonde d'un nœud qui contient attributes: []
    const findAttributesNode = (n: any): any | null => {
      if (!n || typeof n !== 'object') return null;
      if (Array.isArray(n)) {
        for (const it of n) {
          const found = findAttributesNode(it);
          if (found) return found;
        }
        return null;
      }
      if (Array.isArray((n as any).attributes)) return n;
      for (const v of Object.values(n)) {
        const found = findAttributesNode(v);
        if (found) return found;
      }
      return null;
    };

    if (!json || typeof json !== 'object') {
      const out = { ok: false, error: 'Réponse invalide' } as FetchAiAttributesResult;
      cache.set(key, { expiresAt: now + 5_000, data: out });
      return out;
    }

    // Les attributs peuvent être un tableau OU un objet clé → valeur/definition
    const toArray = (attrs: any): AiAttribute[] => {
      if (!attrs) return [];
      if (Array.isArray(attrs)) {
        return attrs.map((a: any) => ({
          key: String(a?.key ?? ''),
          value: a?.value ?? null,
          definition: a?.definition ? String(a.definition) : undefined,
        }));
      }
      if (typeof attrs === 'string') {
        const parsed = tryParse(attrs);
        return toArray(parsed);
      }
      if (typeof attrs === 'object') {
        return Object.entries(attrs).map(([k, v]: [string, any]) => {
          if (v && typeof v === 'object' && 'value' in v) {
            return { key: k, value: (v as any).value ?? null, definition: (v as any).definition ? String((v as any).definition) : undefined };
          }
          return { key: k, value: v ?? null };
        });
      }
      return [];
    };

    const nodeWithAttrs = findAttributesNode(json) || json;
    const attrsSource = (nodeWithAttrs.attributes ?? nodeWithAttrs.attrs ?? nodeWithAttrs.data?.attributes);
    const attributes: AiAttribute[] = toArray(attrsSource);

    const data: FetchAiAttributesResult = {
      ok: attributes.length > 0 || Boolean(nodeWithAttrs.ok || json.ok),
      attributes,
      count: typeof nodeWithAttrs.count === 'number' ? nodeWithAttrs.count : (typeof json.count === 'number' ? json.count : attributes.length),
    };

    cache.set(key, { expiresAt: now + TEN_MINUTES_MS, data });
    return data;
  } catch (err: any) {
    const message = err?.name === 'AbortError' ? 'Timeout' : (err?.message || 'Erreur réseau');
    return { ok: false, error: message };
  }
}

// Note CORS: si le domaine front diffère du domaine du webhook, il faut autoriser ce domaine
// côté serveur (n8n) via les en-têtes CORS. Rien à faire côté client.


