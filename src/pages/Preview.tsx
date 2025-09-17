import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Zap, Target, TrendingUp, BarChart3, Copy, Download, 
  RefreshCw, Play, Settings, Eye, CheckCircle2, AlertTriangle,
  Timer, Users, Sparkles, ArrowRight
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { getRecommendations, type RecoResponse } from '@/lib/recoClient';
import { Api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Hero from '@/components/Hero';

type Recommendation = { product_id: string; score: number; why?: string[]; meta?: Record<string, unknown> };

export default function Preview() {
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState('');
  const [kind, setKind] = useState<'similar' | 'complementary' | 'x-sell'>('similar');
  const [limit, setLimit] = useState('6');
  const tenantDefault = (import.meta.env.VITE_DEFAULT_TENANT as string) || 'la_redoute';
  const [tenant] = useState<string>(tenantDefault);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const autoLoadedRef = useRef(false);

  // Nouveaux états pour l'expérience premium
  const [lastSearchTime, setLastSearchTime] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [showApiPreview, setShowApiPreview] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);

  const pickString = (obj: Record<string, unknown> | undefined, keys: string[]): string | undefined => {
    if (!obj) return undefined;
    for (const key of keys) {
      const value = (obj as any)[key];
      if (typeof value === 'string' && value.trim().length > 0) return value;
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
    }
    return undefined;
  };
  const pickNumber = (obj: Record<string, unknown> | undefined, keys: string[]): number | undefined => {
    if (!obj) return undefined;
    for (const key of keys) {
      const value = (obj as any)[key];
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
    }
    return undefined;
  };

  const handlePreview = async (overrides?: { product_id?: string; kind?: 'similar' | 'complementary' | 'x-sell'; limit?: number }) => {
    const startTime = Date.now();
    setIsLoading(true);
    
    try {
      const chosenKind = overrides?.kind ?? kind;
      const pid = overrides?.product_id ?? productId;
      const lim = overrides?.limit ?? parseInt(limit);
      
      if (!pid) {
        toast({ variant: 'destructive', title: 'Product ID manquant' });
        return;
      }

      const data: RecoResponse = await getRecommendations({ productId: pid, kind: chosenKind, limit: lim, tenant });
      const items = Array.isArray(data.items) ? data.items : [];
      
      // tri desc par score
      const sorted = items.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      let mapped = sorted.map(i => ({ 
        product_id: i.product_id, 
        score: i.score || 0, 
        why: i.why as string[] | undefined, 
        meta: i.meta as Record<string, unknown> | undefined 
      }));

      // Hydratation (optionnelle) via n8n lookup si l'URL est configurée
      try {
        const ids = mapped.map(m => m.product_id);
        if (ids.length > 0) {
          const enriched = await Api.productsLookup({ tenant, ids });
          const byId = new Map<string, any>();
          (enriched || []).forEach((p: any) => {
            // normalise la clé id
            const pid = p.product_id || p.id || p._id;
            if (pid) byId.set(String(pid), p);
          });
          mapped = mapped.map(m => ({
            ...m,
            meta: {
              ...(m.meta || {}),
              ...(byId.get(m.product_id) || {}),
            },
          }));
        }
      } catch (e) {
        // silencieux si le webhook n'est pas dispo
        console.debug('Lookup produits non disponible / ignoré');
      }

      // Calcul des métriques
      const endTime = Date.now();
      const searchTime = endTime - startTime;
      const avgScore = mapped.length > 0 ? mapped.reduce((acc, item) => acc + item.score, 0) / mapped.length : 0;
      
      setRecommendations(mapped);
      setLastSearchTime(searchTime);
      setAverageScore(avgScore);
      
      // Animation success
      toast({ 
        title: '✨ Recommandations générées', 
        description: `${mapped.length} résultats en ${searchTime}ms`
      });

      // mémorise paramètres
      try { 
        localStorage.setItem('preview:last', JSON.stringify({ 
          productId: pid, 
          kind: chosenKind, 
          limit: String(lim) 
        })); 
      } catch {}
      
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erreur de prévisualisation',
        description: "Impossible de récupérer les recommandations",
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const pid = searchParams.get('product_id') || '';
    const k = (searchParams.get('kind') as 'similar' | 'complementary' | 'x-sell') || 'similar';
    const l = searchParams.get('limit') || '3';
    const auto = searchParams.get('auto') === '1';
    if (pid) setProductId(pid);
    if (k) setKind(k);
    if (l) setLimit(l);
    if (auto && pid && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      void handlePreview({ product_id: pid, kind: k, limit: parseInt(l) });
    }
  }, [searchParams]);

  useEffect(() => {
    // charge derniers paramètres si présents
    try {
      const raw = localStorage.getItem('preview:last');
      if (raw) {
        const last = JSON.parse(raw);
        if (last.productId) setProductId(last.productId);
        if (last.kind) setKind(last.kind);
        if (last.limit) setLimit(String(last.limit));
      }
    } catch {}
    // enter pour lancer
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === 'INPUT' || el.getAttribute('role') === 'combobox')) {
          e.preventDefault();
          void handlePreview();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'similar':
        return 'Produits similaires';
      case 'x-sell':
        return 'Cross-sell';
      case 'complementary':
        return 'Produits complémentaires';
      default:
        return kind;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-success';
    if (score >= 0.7) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="space-y-8">
      <Hero
        variant="preview"
        title="Playground des recommandations"
        subtitle="Testez, analysez et optimisez vos algorithmes de recommandation en temps réel."
        actions={[
          { label: 'Documentation API', variant: 'outline', href: '#' }, 
          { label: 'Nouveau test', variant: 'default', onClick: () => { const el = document.getElementById('productId'); el?.focus(); setIsFormFocused(true); } }
        ]}
      />

      {/* Métriques de Performance Premium */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in">
          <div className="kpi-card group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Temps de réponse
              </h3>
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div className="text-display-sm font-display text-foreground mb-1">
              {lastSearchTime}ms
            </div>
            <p className="text-caption text-muted-foreground">
              {lastSearchTime && lastSearchTime < 200 ? 'Excellent' : lastSearchTime && lastSearchTime < 500 ? 'Bon' : 'Acceptable'}
            </p>
          </div>

          <div className="kpi-card group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Score moyen
              </h3>
              <Target className="w-5 h-5 text-success" />
            </div>
            <div className="text-display-sm font-display text-foreground mb-2">
              {(averageScore * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    averageScore >= 0.8 ? 'bg-gradient-to-r from-success to-success/80' :
                    averageScore >= 0.6 ? 'bg-gradient-to-r from-warning to-warning/80' : 'bg-gradient-to-r from-error to-error/80'
                  }`}
                  style={{ width: `${averageScore * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="kpi-card group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Résultats
              </h3>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="text-display-sm font-display text-foreground mb-1">
              {recommendations.length}
            </div>
            <p className="text-caption text-muted-foreground">
              {getKindLabel(kind)}
        </p>
      </div>

          <div className="kpi-card group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Confiance
              </h3>
              <CheckCircle2 className={`w-5 h-5 ${averageScore >= 0.7 ? 'text-success' : 'text-warning'}`} />
            </div>
            <div className="text-display-sm font-display text-foreground mb-1">
              {averageScore >= 0.8 ? 'Élevée' : averageScore >= 0.6 ? 'Moyenne' : 'Faible'}
            </div>
            <p className="text-caption text-muted-foreground">
              Qualité globale
            </p>
          </div>
        </div>
      )}

      {/* Form Premium de Test */}
      <div className={`card-premium p-8 transition-premium ${isFormFocused ? 'ring-2 ring-primary ring-opacity-20 shadow-premium-lg' : ''} animate-fade-in`} style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-premium-sm">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-h1 font-display text-foreground">Configuration du test</h2>
            <p className="text-body text-muted-foreground">Personnalisez vos paramètres de recommandation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product ID Input Premium */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="productId" className="text-body font-medium text-foreground">
                Product ID
              </Label>
                <p className="text-caption text-muted-foreground">Identifiant du produit de base</p>
              </div>
            </div>
            
            <input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              onFocus={() => setIsFormFocused(true)}
              onBlur={() => setIsFormFocused(false)}
              placeholder="Ex: PRD_001, SKU_123..."
              className="input-premium h-12 text-body"
              />
            </div>

          {/* Type de Recommandation */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label className="text-body font-medium text-foreground">
                Type de recommandation
              </Label>
                <p className="text-caption text-muted-foreground">Algorithme à utiliser</p>
              </div>
            </div>

            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger className="h-12 border-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="similar">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Produits similaires</span>
                  </div>
                </SelectItem>
                <SelectItem value="complementary">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>Produits complémentaires</span>
                  </div>
                </SelectItem>
                <SelectItem value="x-sell">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>Cross-sell</span>
                  </div>
                </SelectItem>
                </SelectContent>
              </Select>
            </div>

          {/* Nombre de résultats */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <Label className="text-body font-medium text-foreground">
                Nombre de résultats
              </Label>
                <p className="text-caption text-muted-foreground">Quantité à retourner</p>
              </div>
            </div>

              <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="h-12 border-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 résultats</SelectItem>
                  <SelectItem value="6">6 résultats</SelectItem>
                <SelectItem value="10">10 résultats</SelectItem>
                <SelectItem value="15">15 résultats</SelectItem>
                </SelectContent>
              </Select>
          </div>
            </div>

        {/* Actions Premium */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-border">
          <button
            onClick={() => { void handlePreview(); }}
            disabled={isLoading || !productId}
            className={`btn-premium btn-primary flex-1 h-12 ${isLoading ? 'animate-pulse' : ''}`}
              >
                {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                Génération en cours...
              </>
                ) : (
                  <>
                <Play className="w-5 h-5 mr-3" />
                Lancer le test
                  </>
                )}
          </button>

          <button
            onClick={() => setShowApiPreview(!showApiPreview)}
            disabled={recommendations.length === 0}
            className="btn-premium btn-secondary px-6 h-12"
          >
            <Eye className="w-4 h-4 mr-2" />
            API Response
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({ productId, kind, limit: parseInt(limit), tenant }, null, 2));
              toast({ title: 'Paramètres copiés', description: 'Configuration copiée dans le presse-papier' });
            }}
            className="btn-premium btn-secondary px-6 h-12"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copier config
          </button>
        </div>
      </div>

      {/* Results Premium */}
      <div className="card-premium p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center shadow-premium-sm">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-h1 font-display text-foreground">
                Résultats - {getKindLabel(kind)}
              </h2>
              <p className="text-body text-muted-foreground">
                {isLoading ? 'Génération en cours...' : recommendations.length > 0 ? `${recommendations.length} recommandations trouvées` : 'Prêt pour le test'}
              </p>
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const csv = recommendations.map(r => `${r.product_id},${r.score}`).join('\n');
                  const blob = new Blob([`product_id,score\n${csv}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `recommendations-${productId}-${kind}.csv`;
                  a.click();
                }}
                className="btn-premium btn-secondary px-4 h-10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Loading State Premium */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="card-premium p-6 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-1/4" />
                  </div>
                  <div className="w-20 h-8 bg-muted rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((item, index) => {
              const meta = (item.meta || {}) as Record<string, unknown>;
              const name = pickString(meta, ['name', 'title', 'label']);
              const imageUrl = pickString(meta, ['image_url', 'image', 'imageUrl', 'thumbnail', 'images']);
              const brand = pickString(meta, ['brand', 'vendor', 'manufacturer']);
              const price = pickNumber(meta, ['current_price', 'price']);
              const currency = pickString(meta, ['currency']);
              
              return (
                <div
                  key={`${item.product_id}-${index}`}
                  className="card-premium p-6 hover:shadow-premium-md transition-premium animate-fade-in interactive-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-premium-xs">
                      <span className="text-sm font-bold text-primary-foreground">#{index + 1}</span>
                    </div>

                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-secondary">
                      {imageUrl ? (
                        <img src={imageUrl} alt={name || item.product_id} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 bg-muted rounded" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-medium text-foreground mb-1 truncate">
                        {name || item.product_id}
                      </h3>
                      <p className="text-caption text-muted-foreground mb-2">
                        {brand ? `${brand} • ` : ''}{item.product_id}
                      </p>
                      {price && (
                        <p className="text-body-sm font-medium text-foreground">
                          {price.toLocaleString('fr-FR')} {currency || '€'}
                        </p>
                      )}
                  </div>
                  
                    {/* Score Visualization */}
                    <div className="text-right">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 rounded-full ${getScoreColor(item.score).includes('success') ? 'bg-gradient-to-r from-success to-success/80' : getScoreColor(item.score).includes('warning') ? 'bg-gradient-to-r from-warning to-warning/80' : 'bg-gradient-to-r from-error to-error/80'}`}
                            style={{ width: `${item.score * 100}%` }}
                          />
                        </div>
                        <Badge className={`${getScoreColor(item.score).includes('success') ? 'bg-success-light text-success' : getScoreColor(item.score).includes('warning') ? 'bg-warning-light text-warning' : 'bg-error-light text-error'}`}>
                          {(item.score * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-caption text-muted-foreground">
                        Score de confiance
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="btn-premium btn-secondary h-9 px-3 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-h1 font-display text-foreground mb-4">
              Prêt pour vos tests
            </h3>
            <p className="text-body text-muted-foreground mb-8 max-w-md mx-auto">
              Saisissez un Product ID et lancez votre première recommandation pour voir la magie opérer.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('productId');
                el?.focus();
                setIsFormFocused(true);
              }}
              className="btn-premium btn-primary"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Commencer le test
            </button>
          </div>
        )}
      </div>

      {/* API Preview Premium */}
      {showApiPreview && recommendations.length > 0 && (
        <div className="card-premium p-8 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-h2 font-medium text-foreground">API Response</h3>
                <p className="text-caption text-muted-foreground">Aperçu de la réponse JSON</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify({ productId, kind, limit: parseInt(limit), tenant, items: recommendations }, null, 2));
                  toast({ title: 'JSON copié', description: 'Réponse API copiée dans le presse-papier' });
                }}
                className="btn-premium btn-secondary px-4 h-9 text-xs"
              >
                <Copy className="w-3 h-3 mr-2" />
                Copier JSON
              </button>
              
              <button
                onClick={() => setShowApiPreview(false)}
                className="btn-premium btn-secondary px-4 h-9 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="bg-surface-tertiary rounded-xl p-6 max-h-96 overflow-y-auto">
            <pre className="text-sm font-mono text-foreground leading-relaxed">
{JSON.stringify({
  productId,
  kind,
  limit: parseInt(limit),
  tenant, 
  responseTime: lastSearchTime,
  averageScore,
  items: recommendations 
}, null, 2)}
              </pre>
            </div>
        </div>
      )}
    </div>
  );
}