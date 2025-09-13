import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Api } from '@/lib/api';

export default function Dashboard() {
  const { data: health, isLoading } = useQuery({ queryKey: ['health'], queryFn: Api.health });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre système de recommandations
        </p>
      </div>

      {/* KPI Cards - Santé du service */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Santé du service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '...' : health?.status ?? '-'}
            </div>
            {health?.db && (
              <p className="text-xs text-muted-foreground mt-1">DB: {health.db}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs - vide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Derniers runs d'ingestion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-8 text-center">
            Aucune exécution à afficher
          </div>
        </CardContent>
      </Card>
    </div>
  );
}