import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Database, TrendingUp, Clock, Activity, BarChart3, Target, Zap, AlertTriangle, Users, ShoppingCart, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import Hero from '@/components/Hero';
import { useQuery } from '@tanstack/react-query';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type ApiRun = {
  id?: string;
  tenant?: string;
  type: string;
  status: string;
  counts?: { inserted?: number; updated?: number; failed?: number };
  started_at: string;
  ended_at?: string;
};

const normalizeStatus = (s: string) => {
  const x = s.toLowerCase();
  if (x === 'ok' || x === 'success' || x === 'completed') return 'success';
  if (x === 'warning' || x === 'partial') return 'warning';
  if (x === 'error' || x === 'failed') return 'error';
  return 'pending';
};

// Génère un nom informatif pour un run basé sur ses propriétés
const getRunDisplayName = (run: ApiRun, index: number) => {
  if (run.id && run.id !== '—' && run.id.trim()) {
    return run.id;
  }
  
  // Génère un nom basé sur le type et la date
  const date = new Date(run.started_at);
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  
  return `${run.type}-${dateStr}-${timeStr}`;
};

// Calcule la durée d'exécution
const getRunDuration = (run: ApiRun) => {
  if (!run.ended_at) return null;
  const start = new Date(run.started_at).getTime();
  const end = new Date(run.ended_at).getTime();
  const duration = Math.round((end - start) / 1000); // en secondes
  
  if (duration < 60) return `${duration}s`;
  if (duration < 3600) return `${Math.round(duration / 60)}min`;
  return `${Math.round(duration / 3600)}h`;
};

export default function Dashboard() {
  const { data: health, isLoading: loadingHealth } = useQuery({ queryKey: ['health'], queryFn: Api.health });
  const { data: runs } = useQuery({
    queryKey: ['runs', DEFAULT_TENANT, 'ingest', 20],
    queryFn: () => Api.runs({ tenant: DEFAULT_TENANT, type: 'ingest', limit: 20 }) as Promise<ApiRun[]>,
  });

  const sorted = (runs ?? []).slice().sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  const lastRun = sorted[0];
  const total = sorted.length;
  const success = sorted.filter(r => normalizeStatus(r.status) === 'success').length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const processed = sorted.reduce((acc, r) => acc + (r.counts?.inserted ?? 0) + (r.counts?.updated ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Hero cohérent avec le reste du BO */}
      <Hero
        title="Dashboard"
        subtitle="Vue d'ensemble de votre plateforme de recommandations et du statut des opérations."
        actions={[
          { label: 'Analytics', variant: 'outline' },
          { label: 'Voir les runs', variant: 'default', href: '/performance' },
        ]}
      />

      {/* KPI Cards standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Santé du service</CardTitle>
            {loadingHealth ? (
              <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
            ) : (
              <div className={`w-3 h-3 rounded-full ${String(health?.status || '').toLowerCase() === 'ok' ? 'bg-success' : 'bg-error'}`} />
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {loadingHealth ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <>
                  {String(health?.status || '').toLowerCase() === 'ok' ? (
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-error" />
                  )}
                  <div className="text-2xl font-bold">
                    {health?.status ?? '-'}
                  </div>
                </>
              )}
            </div>
            {('db' in (health || {}) || 'mongo' in (health || {})) && (
              <p className="text-xs text-muted-foreground mt-2">
                DB: {(health as any).db || (health as any).mongo}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernier run</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastRun ? new Date(lastRun.started_at).toLocaleDateString('fr-FR', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '-'}
            </div>
            {lastRun && (
              <div className="mt-2 space-y-1">
                <Badge variant={normalizeStatus(lastRun.status) === 'success' ? 'default' : normalizeStatus(lastRun.status) === 'error' ? 'destructive' : 'secondary'}>
                  {lastRun.status}
                </Badge>
                {getRunDuration(lastRun) && (
                  <p className="text-xs text-muted-foreground">
                    Durée: {getRunDuration(lastRun)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {getRunDisplayName(lastRun, 0)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
            <TrendingUp className={`w-4 h-4 ${successRate >= 90 ? 'text-success' : successRate >= 70 ? 'text-warning' : 'text-error'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <div className="mt-2 space-y-2">
              <Progress value={successRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {success} succès sur {total} runs
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits traités</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processed.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Inserted + Updated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Derniers runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Derniers runs d'ingestion</CardTitle>
            <Button variant="outline" size="sm">
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-8">
              <Database className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">Aucune exécution</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Les runs d'ingestion apparaîtront ici une fois lancés.
              </p>
              <div className="mt-6">
                <Button>
                  <Database className="mr-2 h-4 w-4" />
                  Lancer une ingestion
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.slice(0, 5).map((run, index) => (
                <div key={(run.id ?? run.started_at) + run.status} className="flex items-center">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${
                      normalizeStatus(run.status) === 'success' ? 'bg-success' :
                      normalizeStatus(run.status) === 'error' ? 'bg-error' : 'bg-warning'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {getRunDisplayName(run, index)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {run.type} • {new Date(run.started_at).toLocaleDateString('fr-FR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {getRunDuration(run) && ` • ${getRunDuration(run)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={normalizeStatus(run.status) === 'success' ? 'default' : normalizeStatus(run.status) === 'error' ? 'destructive' : 'secondary'}>
                      {run.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {(run.counts?.inserted ?? 0) + (run.counts?.updated ?? 0)} traités
                    </div>
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