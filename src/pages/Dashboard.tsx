import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Package, Activity, TrendingUp, Server } from 'lucide-react';

const kpis = [
  {
    title: 'Produits actifs',
    value: '12,543',
    icon: Package,
    change: '+12%',
    positive: true,
  },
  {
    title: 'Dernier run',
    value: '2h ago',
    icon: Activity,
    status: 'Completed',
    positive: true,
  },
  {
    title: 'Taux de succès',
    value: '98.5%',
    icon: TrendingUp,
    change: '+0.3%',
    positive: true,
  },
  {
    title: 'Statut santé',
    value: 'Healthy',
    icon: Server,
    status: 'All systems operational',
    positive: true,
  },
];

const recentRuns = [
  {
    id: 'run_001',
    date: '2024-01-15 14:30',
    status: 'success' as const,
    updated: 1243,
    failed: 0,
    type: 'Full Sync',
  },
  {
    id: 'run_002',
    date: '2024-01-15 12:15',
    status: 'warning' as const,
    updated: 856,
    failed: 12,
    type: 'Incremental',
  },
  {
    id: 'run_003',
    date: '2024-01-15 10:00',
    status: 'success' as const,
    updated: 2341,
    failed: 0,
    type: 'Full Sync',
  },
  {
    id: 'run_004',
    date: '2024-01-14 18:45',
    status: 'error' as const,
    updated: 0,
    failed: 156,
    type: 'Incremental',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de votre système de recommandations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              {kpi.change && (
                <p className="text-xs text-success mt-1">
                  {kpi.change} from last month
                </p>
              )}
              {kpi.status && (
                <p className="text-xs text-muted-foreground mt-1">{kpi.status}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Derniers runs d'ingestion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <StatusBadge status={run.status} size="md">
                    {run.status === 'success' && 'Completed'}
                    {run.status === 'warning' && 'Partial'}
                    {run.status === 'error' && 'Failed'}
                  </StatusBadge>
                  <div>
                    <div className="font-medium text-foreground">{run.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {run.type} • {run.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {run.updated} updated
                  </div>
                  {run.failed > 0 && (
                    <div className="text-sm text-error">{run.failed} failed</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}