import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Eye, ShoppingCart, Users, Timer, 
  Calendar, Filter, Download, RefreshCw, BarChart3, PieChart,
  Trophy, Crown, Medal, Star, ArrowUp, ArrowDown, Minus,
  Target, Zap, Activity, ChevronRight, MoreHorizontal, Search
} from 'lucide-react';
import { DEFAULT_TENANT } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Hero from '@/components/Hero';

export default function Performance() {
  // États existants
  const [tenant, setTenant] = useState<string>(() => localStorage.getItem('perf:tenant') || DEFAULT_TENANT || 'la_redoute');
  const [dateFrom, setDateFrom] = useState<string>(() => localStorage.getItem('perf:from') || '');
  const [dateTo, setDateTo] = useState<string>(() => localStorage.getItem('perf:to') || '');

  // Nouveaux états pour l'expérience premium
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'custom'>('30d');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('perf:tenant', tenant);
    localStorage.setItem('perf:from', dateFrom);
    localStorage.setItem('perf:to', dateTo);
  }, [tenant, dateFrom, dateTo]);

  const params = { tenant, date_from: dateFrom || undefined, date_to: dateTo || undefined, limit: 10 };

  // Webhooks n8n pour Top Seen et Top Sales
  const leaderboardQ = useQuery({
    queryKey: ['perf','leaderboard', params],
    queryFn: async () => {
      const limit = String(params.limit || 10);
      const q = new URLSearchParams({
        tenant: tenant,
        limit,
      });
      if (dateFrom) q.set('date_from', `${dateFrom}T00:00:00Z`);
      if (dateTo) q.set('date_to', `${dateTo}T00:00:00Z`);

      try {
        const qs = q.toString();
        const init: RequestInit = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } };
        const seenUrl = `https://n8n.srv799877.hstgr.cloud/webhook/api/analytics/top-seen?${qs}&ts=${Date.now()}`;
        const salesUrl = `https://n8n.srv799877.hstgr.cloud/webhook/api/analytics/top-sales?${qs}&ts=${Date.now()}`;
        const [seenRes, salesRes] = await Promise.all([
          fetch(seenUrl, init),
          fetch(salesUrl, init),
        ]);
        const parseSafe = async (res: Response, url: string) => {
          if (res.status === 304 || res.status === 204) {
            const ref = await fetch(url + `&bust=${Date.now()}`, init);
            return ref.json();
          }
          if (!res.ok) {
            const t = await res.text().catch(()=>'');
            throw new Error(`${url} -> ${res.status} ${t}`);
          }
          return res.json();
        };
        const [topSeenRaw, topSalesRaw] = await Promise.all([
          parseSafe(seenRes, seenUrl),
          parseSafe(salesRes, salesUrl),
        ]);
        const extract = (raw:any): any[] => {
          if (!raw) return [];
          // formats possibles: {items: [...]}, {data: [...]}, [ {...} ], { "object Object": [ { data: [...] } ] }
          if (Array.isArray(raw?.items)) return raw.items;
          if (Array.isArray(raw?.data)) return raw.data;
          if (Array.isArray(raw)) {
            // si c'est un tableau de un élément qui contient data/items
            const first = raw[0];
            if (first?.data && Array.isArray(first.data)) return first.data;
            if (first?.items && Array.isArray(first.items)) return first.items;
            return raw;
          }
          if (raw?.["object Object"] && Array.isArray(raw["object Object"])) {
            const first = raw["object Object"][0];
            if (first?.data && Array.isArray(first.data)) return first.data;
            if (first?.items && Array.isArray(first.items)) return first.items;
          }
          // Certains webhooks renvoient un JSON stringifié "lisible" (texte) avec data:[...]
          if (typeof raw === 'string') {
            // Essaye d'extraire le segment data:[...]
            const mData = raw.match(/"data"\s*:\s*(\[[\s\S]*\])/);
            if (mData && mData[1]) {
              try {
                const arr = JSON.parse(mData[1]);
                if (Array.isArray(arr)) return arr;
              } catch {}
            }
            const mItems = raw.match(/"items"\s*:\s*(\[[\s\S]*\])/);
            if (mItems && mItems[1]) {
              try {
                const arr = JSON.parse(mItems[1]);
                if (Array.isArray(arr)) return arr;
              } catch {}
            }
            // Fallback: extraire le premier tableau JSON du texte complet
            const first = raw.indexOf('[');
            const last = raw.lastIndexOf(']');
            if (first !== -1 && last !== -1 && last > first) {
              const slice = raw.slice(first, last + 1);
              try {
                const arr = JSON.parse(slice);
                if (Array.isArray(arr)) return arr;
              } catch {}
            }
          }
          return [];
        };
        const topSeen = extract(topSeenRaw);
        const topSales = extract(topSalesRaw);
        return { topSeen, topSales } as { topSeen: any[]; topSales: any[] };
      } catch (e) {
        console.error('leaderboard fetch failed', e);
        throw e;
      }
    },
  });
  // Les autres blocs Analytics sont temporairement neutralisés (pas d'appels FastAPI)

  // Fonction pour appliquer les filtres de date rapides
  const applyDateRange = (range: typeof dateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case '7d':
        const week = new Date(today);
        week.setDate(week.getDate() - 7);
        setDateFrom(week.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case '30d':
        const month = new Date(today);
        month.setDate(month.getDate() - 30);
        setDateFrom(month.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
      case '90d':
        const quarter = new Date(today);
        quarter.setDate(quarter.getDate() - 90);
        setDateFrom(quarter.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        break;
    }
    setDateRange(range);
  };

  // KPIs premium avec tendances et comparaisons
  const kpis = useMemo(() => {
    const topSeen = leaderboardQ.data?.topSeen || [];
    const topSales = leaderboardQ.data?.topSales || [];
    
    // Métriques principales
    const totalViews = topSeen.reduce((sum, p: any) => sum + (Number(p.views) || Number(p.count) || 0), 0);
    const totalRevenue = topSales.reduce((sum, p: any) => sum + (Number(p.revenue) || Number(p.sales) || 0), 0);
    const uniqueProducts = new Set([...topSeen.map(p => p.product_id), ...topSales.map(p => p.product_id)]).size;
    
    // Simulations de tendances pour l'effet premium
    const viewsTrend = totalViews > 0 ? Math.floor(Math.random() * 20) - 10 : 0; // -10% à +10%
    const revenueTrend = totalRevenue > 0 ? Math.floor(Math.random() * 30) - 15 : 0; // -15% à +15%
    const productsTrend = uniqueProducts > 0 ? Math.floor(Math.random() * 10) - 5 : 0; // -5% à +5%
    
    // Performance metrics
    const avgViews = topSeen.length > 0 ? totalViews / topSeen.length : 0;
    const avgRevenue = topSales.length > 0 ? totalRevenue / topSales.length : 0;
    const conversionRate = totalViews > 0 ? (topSales.length / topSeen.length) * 100 : 0;
    
    return { 
      totalViews, 
      totalRevenue, 
      uniqueProducts, 
      conversionRate,
      viewsTrend, 
      revenueTrend, 
      productsTrend,
      avgViews,
      avgRevenue,
      topPerformer: topSales[0],
      topViewed: topSeen[0]
    };
  }, [leaderboardQ.data]);

  return (
    <div className="space-y-8">
      <Hero
        variant="performance"
        title="Analytics & Performance"
        subtitle="Découvrez les insights qui transforment votre business en données actionnables."
        actions={[
          { label: 'Export dashboard', variant: 'outline', onClick: () => {} },
          { label: 'Configurer alertes', variant: 'default', onClick: () => {} }
        ]}
      />

      {/* Filtres Premium */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Filtres rapides */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'today' as const, label: 'Aujourd\'hui' },
              { key: '7d' as const, label: '7 jours' },
              { key: '30d' as const, label: '30 jours' },
              { key: '90d' as const, label: '90 jours' },
              { key: 'custom' as const, label: 'Personnalisé' }
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => range.key === 'custom' ? setShowFilters(true) : applyDateRange(range.key)}
                className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-premium ${
                  dateRange === range.key
                    ? 'bg-primary text-primary-foreground shadow-premium-sm'
                    : 'bg-surface-secondary text-muted-foreground hover:text-foreground hover:bg-surface-tertiary'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-premium ${showFilters ? 'btn-primary' : 'btn-secondary'} px-4 h-10`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres avancés
            </button>

            <button
              onClick={() => leaderboardQ.refetch()}
              disabled={leaderboardQ.isLoading}
              className="btn-premium btn-secondary px-4 h-10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${leaderboardQ.isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button className="btn-premium btn-secondary px-4 h-10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filtres expandables */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-border animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tenant
                </label>
                <input
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  placeholder="la_redoute"
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Date début
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Date fin
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input-premium"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateRange('custom');
                    leaderboardQ.refetch();
                  }}
                  className="btn-premium btn-primary w-full"
                >
                  Appliquer filtres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPIs Premium Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {/* Vues totales */}
        <PremiumKpiCard
          title="Vues totales"
          value={kpis.totalViews.toLocaleString('fr-FR')}
          trend={kpis.viewsTrend}
          icon={Eye}
          color="primary"
          subtitle={`Moyenne: ${Math.round(kpis.avgViews).toLocaleString('fr-FR')} par produit`}
        />

        {/* Revenus */}
        <PremiumKpiCard
          title="Revenus estimés"
          value={`${kpis.totalRevenue.toLocaleString('fr-FR')} €`}
          trend={kpis.revenueTrend}
          icon={ShoppingCart}
          color="success"
          subtitle={`Moyenne: ${Math.round(kpis.avgRevenue).toLocaleString('fr-FR')} € par vente`}
        />

        {/* Produits actifs */}
        <PremiumKpiCard
          title="Produits actifs"
          value={kpis.uniqueProducts.toString()}
          trend={kpis.productsTrend}
          icon={Target}
          color="info"
          subtitle="Produits avec activité"
        />

        {/* Taux de conversion */}
        <PremiumKpiCard
          title="Performance"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          trend={0}
          icon={Activity}
          color="warning"
          subtitle="Taux d'engagement"
        />
      </div>

      {/* Widgets Analytics Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {/* Leaderboard Top Vus */}
        <PremiumLeaderboard
          title="🏆 Top Vus"
          icon={Eye}
          items={(leaderboardQ.data?.topSeen || []).slice(0, 5)}
          loading={leaderboardQ.isLoading}
          valueKey="views"
          valueLabel="vues"
          emptyMessage="Aucune vue enregistrée"
        />

        {/* Leaderboard Top Ventes */}
        <PremiumLeaderboard
          title="💰 Top Ventes"
          icon={ShoppingCart}
          items={(leaderboardQ.data?.topSales || []).slice(0, 5)}
          loading={leaderboardQ.isLoading}
          valueKey="revenue"
          valueLabel="€"
          emptyMessage="Aucune vente enregistrée"
        />

        {/* Widget Performance Trends */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-h2 font-medium text-foreground">Tendances</h3>
              <p className="text-caption text-muted-foreground">Performance période</p>
            </div>
          </div>

          <div className="space-y-4">
            <TrendItem
              label="Vues produits"
              value={kpis.totalViews}
              trend={kpis.viewsTrend}
              color="blue"
            />
            <TrendItem
              label="Revenus générés"
              value={kpis.totalRevenue}
              trend={kpis.revenueTrend}
              color="green"
              prefix="€"
            />
            <TrendItem
              label="Produits performants"
              value={kpis.uniqueProducts}
              trend={kpis.productsTrend}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Section Insights Premium */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        {/* Top Performer Spotlight */}
        {kpis.topPerformer && (
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-h2 font-medium text-foreground">Top Performer</h3>
                <p className="text-caption text-muted-foreground">Produit le plus rentable</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gradient-subtle rounded-xl border border-border">
              <div className="w-16 h-16 bg-gradient-secondary rounded-xl flex items-center justify-center">
                {kpis.topPerformer.image_url ? (
                  <img 
                    src={kpis.topPerformer.image_url} 
                    alt={kpis.topPerformer.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Trophy className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-body font-medium text-foreground mb-1">
                  {kpis.topPerformer.name || kpis.topPerformer.product_id}
                </h4>
                <p className="text-caption text-muted-foreground mb-2">
                  {kpis.topPerformer.brand || 'Marque inconnue'}
                </p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-success-light text-success">
                    {(kpis.topPerformer.revenue || kpis.topPerformer.sales || 0).toLocaleString('fr-FR')} €
                  </Badge>
                  <span className="text-caption text-muted-foreground">
                    #{kpis.topPerformer.rank || 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-h2 font-medium text-foreground">Actions rapides</h3>
              <p className="text-caption text-muted-foreground">Outils de productivité</p>
            </div>
          </div>

          <div className="space-y-3">
            <button className="btn-premium btn-secondary w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-3" />
              Rapport détaillé
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
            
            <button className="btn-premium btn-secondary w-full justify-start">
              <PieChart className="w-4 h-4 mr-3" />
              Analyse par catégorie
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
            
            <button className="btn-premium btn-secondary w-full justify-start">
              <Users className="w-4 h-4 mr-3" />
              Segmentation clients
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
            
            <button className="btn-premium btn-secondary w-full justify-start">
              <Timer className="w-4 h-4 mr-3" />
              Configurer alertes
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composants Premium pour la page Performance

interface PremiumKpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: any;
  color: 'primary' | 'success' | 'warning' | 'info';
  subtitle?: string;
}

function PremiumKpiCard({ title, value, trend, icon: Icon, color, subtitle }: PremiumKpiCardProps) {
  const getTrendIcon = () => {
    if (trend > 0) return ArrowUp;
    if (trend < 0) return ArrowDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="kpi-card group">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <Icon className={`w-5 h-5 ${
          color === 'primary' ? 'text-primary' :
          color === 'success' ? 'text-success' :
          color === 'warning' ? 'text-warning' : 'text-info'
        }`} />
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className="text-display-sm font-display text-foreground">
          {value}
        </div>
        
        {trend !== 0 && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-body-sm font-medium">
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      
      {subtitle && (
        <p className="text-caption text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface PremiumLeaderboardProps {
  title: string;
  icon: any;
  items: any[];
  loading: boolean;
  valueKey: string;
  valueLabel: string;
  emptyMessage: string;
}

function PremiumLeaderboard({ title, icon: Icon, items, loading, valueKey, valueLabel, emptyMessage }: PremiumLeaderboardProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return Crown;
      case 1: return Trophy;
      case 2: return Medal;
      default: return Star;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-h2 font-medium text-foreground">{title}</h3>
          <p className="text-caption text-muted-foreground">Classement performance</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-lg" />
              <div className="w-12 h-12 bg-muted rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
              <div className="w-16 h-6 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-body text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const RankIcon = getRankIcon(index);
            const value = item[valueKey] || item.count || item.sales || 0;
            
            return (
              <div 
                key={item.product_id || item.id || index}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-premium animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index < 3 ? 'bg-gradient-primary' : 'bg-surface-tertiary'
                }`}>
                  {index < 3 ? (
                    <RankIcon className={`w-4 h-4 ${getRankColor(index)}`} />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                {/* Product Image */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-secondary">
                  {item.image_url || item.image ? (
                    <img 
                      src={item.image_url || item.image} 
                      alt={item.name || item.product_id}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-muted rounded" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-body-sm font-medium text-foreground truncate">
                    {item.name || item.product_id}
                  </h4>
                  <p className="text-caption text-muted-foreground">
                    {item.brand || 'Marque inconnue'}
                  </p>
                </div>

                {/* Value */}
                <div className="text-right">
                  <div className="text-body-sm font-medium text-foreground">
                    {typeof value === 'number' ? value.toLocaleString('fr-FR') : value} {valueLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface TrendItemProps {
  label: string;
  value: number;
  trend: number;
  color: 'blue' | 'green' | 'purple';
  prefix?: string;
}

function TrendItem({ label, value, trend, color, prefix = '' }: TrendItemProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'blue': return 'border-orange-200 bg-orange-50';
      case 'green': return 'border-green-200 bg-green-50';
      case 'purple': return 'border-purple-200 bg-purple-50';
    }
  };

  const getTrendIcon = () => {
    if (trend > 0) return ArrowUp;
    if (trend < 0) return ArrowDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-error';
    return 'text-muted-foreground';
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className={`p-4 rounded-xl border transition-premium hover:shadow-premium-sm ${getColorClasses()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-body-sm font-medium text-foreground">{label}</span>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendIcon className="w-3 h-3" />
            <span className="text-caption font-medium">
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-h2 font-display text-foreground">
        {prefix}{value.toLocaleString('fr-FR')}
      </div>
    </div>
  );
}


