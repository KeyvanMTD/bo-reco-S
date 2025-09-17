import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAiAttributes } from '@/hooks/useAiAttributes';
import { Button } from '@/components/ui/button';

type Props = {
  productId: string;
  tenant: string;
};

export default function ProductDetails({ productId, tenant }: Props) {
  const { data, loading, error, refetch } = useAiAttributes(productId, tenant);
  const lowQuality = (data?.count ?? data?.attributes?.length ?? 0) < 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Attributs IA</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Attributs indisponibles</span>
            <Button size="sm" variant="outline" onClick={refetch}>Rafraîchir</Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {lowQuality && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg border border-border bg-muted/30">
                <span>Qualité faible</span>
                <Button size="sm" variant="outline" onClick={refetch}>Rafraîchir</Button>
              </div>
            )}

            {(!data?.attributes || data.attributes.length === 0) ? (
              <div className="text-sm text-muted-foreground">Aucun attribut</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.attributes.map((a, idx) => (
                  <div key={idx} className="p-2 rounded-lg border border-border bg-card hover:bg-card/80">
                    <div className="text-xs text-muted-foreground" title={a.definition || ''}>{String(a.key)}</div>
                    <div className="text-sm text-foreground break-words">{String(a.value)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Exemple d'usage:
// <ProductDetails productId="prod_0419fd8aa58c" tenant="la_redoute" />


