import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, RefreshCw, Calendar } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ApiRun = {
  id: string;
  tenant: string;
  type: string;
  status: string;
  counts?: { inserted?: number; updated?: number; failed?: number };
  started_at: string;
  ended_at?: string;
};

export default function Ingestions() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', DEFAULT_TENANT, 'ingest'],
    queryFn: () => Api.runs({ tenant: DEFAULT_TENANT, type: 'ingest', limit: 20 }),
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  const handleStartIngestion = async () => {
    const feedUrl = window.prompt('URL du feed produit ?');
    if (!feedUrl) return;
    try {
      await Api.ingestStart({ tenant: DEFAULT_TENANT, feed_url: feedUrl, feed_type: 'json', batch_size: 100, dry_run: false });
      toast({ title: 'Ingestion démarrée', description: 'Le run a été lancé avec succès.' });
      queryClient.invalidateQueries({ queryKey: ['runs', DEFAULT_TENANT, 'ingest'] });
    } catch (e) {
      toast({ variant: 'destructive', title: "Échec de l'ingestion", description: 'Vérifiez le feed et réessayez.' });
      console.error(e);
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
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={handleStartIngestion}>
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
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Chargement…</div>
          ) : !runs || runs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Aucun historique d'ingestion à afficher
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run: ApiRun) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
                      {getStatusLabel(run.status)}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{run.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {run.type}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center space-x-8">
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
                    {run.counts?.failed !== undefined && run.counts.failed > 0 && (
                      <div className="text-center">
                        <div className="text-sm font-medium text-error">{run.counts.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatDate(run.started_at)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run.ended_at ? `to ${formatDate(run.ended_at)}` : ''}
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Détails
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}