import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type ApiRun = {
  id?: string;
  tenant?: string;
  type: string;
  status: string;
  counts?: { inserted?: number; updated?: number; failed?: number };
  started_at: string;
  ended_at?: string;
};

export default function Runs() {
  const [type, setType] = useState<string>('ingest');
  const [limit, setLimit] = useState<string>('20');

  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', DEFAULT_TENANT, type, limit],
    queryFn: () => Api.runs({ tenant: DEFAULT_TENANT, type, limit: parseInt(limit) }),
  });

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('fr-FR');
  };

  const statusClass = (s: string) => {
    if (s === 'success' || s === 'completed') return 'text-success';
    if (s === 'warning' || s === 'partial') return 'text-warning';
    if (s === 'error' || s === 'failed') return 'text-error';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Runs</h1>
          <p className="text-muted-foreground mt-1">Historique des exécutions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingest">Ingestion</SelectItem>
                  <SelectItem value="recommendations">Recommandations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Limit</label>
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="20" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Résultats</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Chargement…</div>
          ) : !runs || runs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Aucun run</div>
          ) : (
            <div className="space-y-3">
              {runs.map((run: ApiRun, idx: number) => (
                <div key={run.id ?? `${run.type}-${run.started_at}-${idx}`} className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className={`text-xs px-2 py-1 rounded-full border border-border ${statusClass(run.status)}`}>
                      {run.status}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{run.id ?? '—'}</div>
                      <div className="text-sm text-muted-foreground">{run.type} {run.tenant ? `• ${run.tenant}` : ''}</div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-8">
                    {run.counts?.inserted !== undefined && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-success">{run.counts.inserted}</div>
                        <div className="text-xs text-muted-foreground">Inserted</div>
                      </div>
                    )}
                    {run.counts?.updated !== undefined && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-warning">{run.counts.updated}</div>
                        <div className="text-xs text-muted-foreground">Updated</div>
                      </div>
                    )}
                    {run.counts?.failed !== undefined && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-error">{run.counts.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-foreground">{formatDate(run.started_at)}</div>
                    <div className="text-muted-foreground">{run.ended_at ? `to ${formatDate(run.ended_at)}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


