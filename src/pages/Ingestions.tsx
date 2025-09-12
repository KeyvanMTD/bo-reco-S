import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Play, RefreshCw, Calendar } from 'lucide-react';

const ingestionRuns = [
  {
    id: 'RUN_001',
    type: 'Full Sync',
    status: 'success' as const,
    inserted: 1243,
    updated: 856,
    failed: 0,
    startedAt: '2024-01-15 14:30:00',
    endedAt: '2024-01-15 14:45:12',
    duration: '15m 12s',
  },
  {
    id: 'RUN_002',
    type: 'Incremental',
    status: 'warning' as const,
    inserted: 234,
    updated: 567,
    failed: 12,
    startedAt: '2024-01-15 12:15:00',
    endedAt: '2024-01-15 12:22:45',
    duration: '7m 45s',
  },
  {
    id: 'RUN_003',
    type: 'Full Sync',
    status: 'success' as const,
    inserted: 2341,
    updated: 0,
    failed: 0,
    startedAt: '2024-01-15 10:00:00',
    endedAt: '2024-01-15 10:18:30',
    duration: '18m 30s',
  },
  {
    id: 'RUN_004',
    type: 'Incremental',
    status: 'error' as const,
    inserted: 0,
    updated: 0,
    failed: 156,
    startedAt: '2024-01-14 18:45:00',
    endedAt: '2024-01-14 18:47:15',
    duration: '2m 15s',
  },
  {
    id: 'RUN_005',
    type: 'Full Sync',
    status: 'success' as const,
    inserted: 1876,
    updated: 1234,
    failed: 3,
    startedAt: '2024-01-14 16:30:00',
    endedAt: '2024-01-14 16:52:18',
    duration: '22m 18s',
  },
];

export default function Ingestions() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'warning':
        return 'Partial';
      case 'error':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Ingestions</h1>
          <p className="text-muted-foreground mt-1">
            Gérez et surveillez vos processus d'ingestion de données
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Planifier
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Play className="w-4 h-4 mr-2" />
            Lancer ingestion
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernière ingestion</p>
                <p className="text-2xl font-bold text-foreground">2h ago</p>
                <p className="text-xs text-success mt-1">Completed successfully</p>
              </div>
              <div className="p-3 bg-success-light rounded-full">
                <RefreshCw className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de succès (24h)</p>
                <p className="text-2xl font-bold text-foreground">94.2%</p>
                <p className="text-xs text-warning mt-1">-2.1% vs yesterday</p>
              </div>
              <div className="p-3 bg-warning-light rounded-full">
                <RefreshCw className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produits traités</p>
                <p className="text-2xl font-bold text-foreground">6,750</p>
                <p className="text-xs text-success mt-1">+15% vs last week</p>
              </div>
              <div className="p-3 bg-success-light rounded-full">
                <RefreshCw className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Historique des runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ingestionRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <StatusBadge status={run.status} size="md">
                    {getStatusLabel(run.status)}
                  </StatusBadge>
                  <div>
                    <div className="font-medium text-foreground">{run.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {run.type} • Durée: {run.duration}
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-sm font-medium text-success">{run.inserted}</div>
                    <div className="text-xs text-muted-foreground">Inserted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-warning">{run.updated}</div>
                    <div className="text-xs text-muted-foreground">Updated</div>
                  </div>
                  {run.failed > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-medium text-error">{run.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(run.startedAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    to {formatDate(run.endedAt)}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Détails
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}