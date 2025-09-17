import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAiAttributes, FetchAiAttributesResult } from '@/lib/fetchAiAttributes';

export function useAiAttributes(productId: string, tenant: string) {
  const [data, setData] = useState<FetchAiAttributesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const load = useCallback(async () => {
    if (!productId || !tenant) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiAttributes(productId, tenant);
      if (!mounted.current) return;
      if (!res.ok) {
        setError(res.error || 'Indisponible');
        setData(res);
      } else {
        setData(res);
      }
    } catch (e: any) {
      if (!mounted.current) return;
      setError(e?.message || 'Indisponible');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [productId, tenant]);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, refetch: load };
}

export type UseAiAttributesReturn = ReturnType<typeof useAiAttributes>;


