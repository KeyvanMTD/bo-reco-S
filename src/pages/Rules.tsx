import { useEffect, useMemo, useState } from 'react';
import Hero from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listRules, createRule, updateRule, deleteRule, previewRule } from '@/lib/api-rules';
import { Rule } from '@/schemas/rules';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings2, Zap, TrendingUp, Target, Play, Pause, Edit3, Trash2, 
  Eye, BarChart3, Brain, Lightbulb, Filter, Search, Grid3X3, 
  List, Plus, ChevronRight, ArrowUp, ArrowDown, Crown, Trophy,
  Activity, Layers, FlaskConical, PieChart, LineChart, Users,
  ShoppingCart, Clock, CheckCircle2, AlertTriangle, Minus,
  ArrowRightLeft, Split, Merge, Shuffle, MousePointer
} from 'lucide-react';

// Composants manquants pour les onglets
function OrchestrationTab({
  items,
  loading,
  view,
  setView,
  sort,
  setSort,
  mode,
  setMode,
  kind,
  setKind,
  q,
  setQ,
  refresh,
  showFilters,
  setShowFilters,
  orchestrationMetrics,
  openEdit,
  onPauseResume,
  onDelete,
  onOpenPreview
}: any) {
  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous modes</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Pausées</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="similar">Similar</SelectItem>
                <SelectItem value="complementary">Complementary</SelectItem>
                <SelectItem value="x-sell">X-sell</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-surface-tertiary rounded-lg">
              <button
                onClick={() => setView('cards')}
                className={`p-2 rounded-md transition ${view === 'cards' ? 'bg-surface-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-md transition ${view === 'table' ? 'bg-surface-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority_desc">Priorité ↓</SelectItem>
                <SelectItem value="updated_desc">Modifié ↓</SelectItem>
                <SelectItem value="impact_desc">Impact ↓</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <Activity className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des règles */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Settings2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune règle trouvée</h3>
            <p className="text-muted-foreground mb-6">Créez votre première règle pour commencer à optimiser vos recommandations.</p>
          </div>
        ) : (
          <div className={view === 'cards' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}>
            {items.map((rule: any) => (
              <Card key={rule._id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.mode === 'active' ? 'default' : rule.mode === 'paused' ? 'secondary' : 'outline'}>
                        {rule.mode}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onOpenPreview(rule)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(rule)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onPauseResume(rule)}>
                          {rule.mode === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onDelete(rule)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Priorité</span>
                      <span className="font-medium">{rule.priority || 0}</span>
                    </div>
                    
                    {rule.kind_scope && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Types:</span>
                        <div className="flex gap-1">
                          {rule.kind_scope.map((k: string) => (
                            <Badge key={k} variant="outline" className="text-xs">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {rule.ranking?.boosts?.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Boosts:</span> {rule.ranking.boosts.length}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleBuilderTab({
  ruleBuilderMode,
  setRuleBuilderMode,
  openCreate
}: any) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-8 text-center">
        <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-4">Constructeur de règles visuel</h2>
        <p className="text-muted-foreground mb-6">
          Créez des règles complexes avec une interface intuitive de glisser-déposer.
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant={ruleBuilderMode === 'visual' ? 'default' : 'outline'}
            onClick={() => setRuleBuilderMode('visual')}
          >
            <MousePointer className="w-4 h-4 mr-2" />
            Mode Visuel
          </Button>
          <Button
            variant={ruleBuilderMode === 'advanced' ? 'default' : 'outline'}
            onClick={() => setRuleBuilderMode('advanced')}
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Mode Avancé
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground mb-6">
          Fonctionnalité en développement - Utilisez le formulaire classique pour l'instant
        </div>
        
        <Button onClick={openCreate} className="btn-premium">
          <Plus className="w-4 h-4 mr-2" />
          Créer une règle
        </Button>
      </div>
    </div>
  );
}

function AnalyticsTab({
  items,
  insights,
  insightsLoading,
  insightsRuleId,
  setInsightsRuleId,
  loadInsights,
  orchestrationMetrics
}: any) {
  return (
    <div className="space-y-6">
      {/* Sélection de règle pour analytics */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Analytics des règles</h3>
          <Select value={insightsRuleId} onValueChange={setInsightsRuleId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner une règle" />
            </SelectTrigger>
            <SelectContent>
              {items.map((rule: any) => (
                <SelectItem key={rule._id} value={rule._id}>
                  {rule.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {insightsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement des insights...</div>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Hits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.kpis?.hits || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{((insights.kpis?.ctr || 0) * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{(insights.kpis?.revenue || 0).toFixed(0)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Uplift 7j</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">+{((insights.kpis?.uplift7 || 0) * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Sélectionnez une règle pour voir ses analytics
          </div>
        )}
      </div>
      
      {/* Métriques globales */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-medium mb-4">Vue d'ensemble</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{orchestrationMetrics.totalRules}</div>
            <div className="text-sm text-muted-foreground">Règles totales</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success">{orchestrationMetrics.activeRules}</div>
            <div className="text-sm text-muted-foreground">Règles actives</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{orchestrationMetrics.healthScore}%</div>
            <div className="text-sm text-muted-foreground">Score santé</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAssistTab({
  prefillBoostStockSuggestion,
  setEditing,
  setForm,
  defaultForm,
  setOpenForm,
  setOpenPreview
}: any) {
  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Assistant IA</h2>
          <p className="text-muted-foreground">
            L'IA analyse vos données pour vous suggérer des règles optimales
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Suggestion 1 */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={prefillBoostStockSuggestion}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <CardTitle className="text-lg">Boost Stock Élevé</CardTitle>
                  <p className="text-sm text-muted-foreground">Recommandation IA</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Favoriser les produits avec un stock élevé pour améliorer la disponibilité
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Crown className="w-3 h-3" />
                <span>Impact estimé: +12% conversion</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Suggestion 2 */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Diversité par Marque</CardTitle>
                  <p className="text-sm text-muted-foreground">À venir</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Équilibrer les marques dans les recommandations
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3" />
                <span>Impact estimé: +8% satisfaction</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Suggestion 3 */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow opacity-60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Promotion Saisonnière</CardTitle>
                  <p className="text-sm text-muted-foreground">À venir</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Adapter les recommandations aux tendances saisonnières
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Impact estimé: +15% ventes</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 p-6 bg-surface-secondary rounded-lg">
          <h3 className="font-medium text-foreground mb-2">💡 Le saviez-vous ?</h3>
          <p className="text-sm text-muted-foreground">
            L'IA analyse plus de 50 métriques en temps réel pour vous proposer les règles les plus pertinentes. 
            Plus vous utilisez le système, plus les suggestions s'améliorent !
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
  // États de base existants
  const [mode, setMode] = useState('all');
  const [kind, setKind] = useState('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'orchestration'|'builder'|'insights'|'ai'>('orchestration');
  const [view, setView] = useState<'cards'|'table'|'timeline'>('cards');
  const [sort, setSort] = useState<'priority_desc'|'updated_desc'|'impact_desc'>('priority_desc');

  // Nouveaux états pour l'expérience premium
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'none'|'pause'|'activate'|'delete'>('none');
  const [ruleBuilderMode, setRuleBuilderMode] = useState<'visual'|'advanced'>('visual');

  // Create/Edit dialog state
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  type BoostRow = { field: string; op: 'eq'|'neq'|'gte'|'lte'|'gt'|'lt'|string; value: string; weight: number };
  type FormState = {
    name: string; description?: string; mode: string; priority: number;
    kind_similar: boolean; kind_complementary: boolean; kind_xsell: boolean;
    include_in_stock: boolean; min_price?: string; max_price?: string;
    target_category_path?: string; target_product_ids?: string;
    exclude_vendors?: string; exclude_brands?: string; exclude_categories?: string; exclude_product_ids?: string;
    pins?: string; blocklist?: string;
    boosts: BoostRow[]; penalties: BoostRow[];
    diversity_by?: 'brand'|'category'|''; diversity_max?: number;
  };
  const [form, setForm] = useState<FormState | null>(null);

  const defaultForm = (prev?: FormState | null): FormState => prev ?? ({
    name: '', description: '', mode: 'draft', priority: 50,
    kind_similar: true, kind_complementary: true, kind_xsell: true,
    include_in_stock: false, min_price: '', max_price: '',
    target_category_path: '', target_product_ids: '',
    exclude_vendors: '', exclude_brands: '', exclude_categories: '', exclude_product_ids: '',
    pins: '', blocklist: '', boosts: [], penalties: [],
    diversity_by: '', diversity_max: 2,
  });
  const upd = (patch: Partial<FormState>) => setForm(prev => ({ ...defaultForm(prev), ...patch }));

  // Preview dialog state
  const [openPreview, setOpenPreview] = useState(false);
  const [previewParams, setPreviewParams] = useState<{ product_id: string; kind: 'similar'|'complementary'|'x-sell' }>({ product_id: '', kind: 'similar' });
  const [previewData, setPreviewData] = useState<{ before: any[]; after: any[] } | null>(null);

  // Insights state (placeholder v1)
  const [insightsRuleId, setInsightsRuleId] = useState<string>('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<{ kpis?: any; topProducts?: any[]; logs?: any[] } | null>(null);

  const loadInsights = async (ruleId: string) => {
    setInsightsLoading(true);
    try {
      // TODO: brancher sur un endpoint n8n analytics (rule insights)
      // Placeholder statique pour v1
      const demo = {
        kpis: {
          hits: 1240,
          ctr: 0.084,
          revenue: 5230.75,
          uplift7: +0.12,
          uplift30: +0.08,
        },
        topProducts: [
          { product_id: 'prod_abc123', name: 'Nike Pegasus 40', before_rank: 8, after_rank: 2, delta: -6, hits: 129 },
          { product_id: 'prod_def456', name: 'Adidas Ultraboost', before_rank: 15, after_rank: 6, delta: -9, hits: 92 },
        ],
        logs: [
          { at: new Date().toISOString(), product_id: 'prod_abc123', action: 'boosted', delta: +5 },
          { at: new Date().toISOString(), product_id: 'prod_xyz777', action: 'blocked', delta: 0 },
        ],
      };
      setInsights(demo);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Auto-chargement mock quand on ouvre l'onglet Insights
  useEffect(() => {
    if (activeTab !== 'insights') return;
    if (insightsLoading) return;
    if (insights) return; // déjà chargé
    if (insightsRuleId) { void loadInsights(insightsRuleId); return; }
    if (items.length > 0) {
      setInsightsRuleId(items[0]._id);
      void loadInsights(items[0]._id);
      return;
    }
    // aucun item -> charger un demo par défaut
    void loadInsights('demo');
  }, [activeTab, items, insightsRuleId, insightsLoading, insights]);

  // AI Suggestions (v2) — préremplissage du formulaire
  const [aiSimProductId, setAiSimProductId] = useState('');
  const [aiSimKind, setAiSimKind] = useState<'similar'|'complementary'|'x-sell'>('complementary');
  const prefillBoostStockSuggestion = () => {
    setEditing(null);
    setForm(defaultForm({
      name: 'Boost stock>=20 (+5) — Running/Homme',
      description: '+5 si stock >= 20 sur Running/Homme',
      mode: 'draft',
      priority: 80,
      kind_complementary: true,
      kind_similar: false,
      kind_xsell: false,
      target_category_path: 'Homme/Chaussures/Running',
      boosts: [{ field: 'stock', op: 'gte', value: '20', weight: 5 }],
    } as any));
    setOpenForm(true);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listRules({ mode, kind, q, page: 1, page_size: 20 });
      setItems(res.items as Rule[]);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les règles' });
    } finally { setLoading(false); }
  };
  useEffect(()=>{ void refresh(); }, [mode, kind]);

  // Métriques d'orchestration premium
  const orchestrationMetrics = useMemo(() => {
    const totalRules = items.length;
    const activeRules = items.filter(r => r.mode === 'active').length;
    const draftRules = items.filter(r => r.mode === 'draft').length;
    const pausedRules = items.filter(r => r.mode === 'paused').length;
    
    // Simulations d'impact business (à remplacer par vraies métriques)
    const estimatedImpact = activeRules * 2.3; // % d'amélioration CTR simulé
    const rulesWithBoosts = items.filter(r => r.ranking?.boosts?.length).length;
    const rulesWithPins = items.filter(r => r.overrides?.pins?.length).length;
    
    // Distribution par type de recommandation
    const similarRules = items.filter(r => r.kind_scope?.includes('similar')).length;
    const complementaryRules = items.filter(r => r.kind_scope?.includes('complementary')).length;
    const xsellRules = items.filter(r => r.kind_scope?.includes('x-sell')).length;
    
    return {
      totalRules,
      activeRules,
      draftRules,
      pausedRules,
      healthScore: totalRules > 0 ? Math.round((activeRules / totalRules) * 100) : 0,
      estimatedImpact,
      rulesWithBoosts,
      rulesWithPins,
      coverage: { similar: similarRules, complementary: complementaryRules, xsell: xsellRules }
    };
  }, [items]);

  // Items triés pour l'affichage
  const displayItems = useMemo(()=>{
    const arr = [...items];
    if (sort === 'priority_desc') {
      arr.sort((a,b)=>(b.priority||0)-(a.priority||0));
    } else if (sort === 'updated_desc') {
      arr.sort((a,b)=> new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
    } else if (sort === 'impact_desc') {
      // Tri par impact simulé (priorité * nombre de contraintes)
      arr.sort((a,b)=> {
        const impactA = (a.priority || 0) * ((a.ranking?.boosts?.length || 0) + (a.overrides?.pins?.length || 0) + 1);
        const impactB = (b.priority || 0) * ((b.ranking?.boosts?.length || 0) + (b.overrides?.pins?.length || 0) + 1);
        return impactB - impactA;
      });
    }
    return arr;
  }, [items, sort]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setOpenForm(true);
  };
  const openEdit = (r: Rule) => {
    setEditing(r);
    setForm({
      name: r.name, description: r.description, mode: r.mode, priority: r.priority,
      kind_similar: !!(r.kind_scope||['similar','complementary','x-sell']).includes('similar'),
      kind_complementary: !!(r.kind_scope||['similar','complementary','x-sell']).includes('complementary'),
      kind_xsell: !!(r.kind_scope||['similar','complementary','x-sell']).includes('x-sell'),
      include_in_stock: !!r.constraints?.include_only?.in_stock,
      min_price: r.constraints?.include_only?.min_price !== undefined && r.constraints?.include_only?.min_price !== null ? String(r.constraints?.include_only?.min_price) : '',
      max_price: r.constraints?.include_only?.max_price !== undefined && r.constraints?.include_only?.max_price !== null ? String(r.constraints?.include_only?.max_price) : '',
      target_category_path: (r.target?.category_path||[]).join(', '),
      target_product_ids: (r.target?.product_ids||[]).join(', '),
      exclude_vendors: (r.constraints?.exclude?.vendors||[]).join(', '),
      exclude_brands: (r.constraints?.exclude?.brands||[]).join(', '),
      exclude_categories: (r.constraints?.exclude?.categories||[]).join(', '),
      exclude_product_ids: (r.constraints?.exclude?.product_ids||[]).join(', '),
      pins: (r.overrides?.pins||[]).join(', '),
      blocklist: (r.overrides?.blocklist||[]).join(', '),
      boosts: (r.ranking?.boosts||[]).map(b=>({ field: b.field, op: b.op, value: String(b.value), weight: b.weight })),
      penalties: (r.ranking?.penalties||[]).map(b=>({ field: b.field, op: b.op, value: String(b.value), weight: b.weight })),
      diversity_by: (r.diversity?.by||'') as any, diversity_max: r.diversity?.max_per_group || 2,
    });
    setOpenForm(true);
  };
  const splitCsv = (s?: string) => (s ? s.split(',').map(x=>x.trim()).filter(Boolean) : undefined);
  const submitForm = async () => {
    if (!form) return;
    try {
      const kind_scope = [form.kind_similar && 'similar', form.kind_complementary && 'complementary', form.kind_xsell && 'x-sell'].filter(Boolean) as ('similar'|'complementary'|'x-sell')[];
      const payload: any = {
        name: form.name, description: form.description, mode: form.mode, priority: Number(form.priority), kind_scope,
        target: {
          category_path: splitCsv(form.target_category_path),
          product_ids: splitCsv(form.target_product_ids),
        },
        constraints: {
          include_only: {
            in_stock: form.include_in_stock || undefined,
            min_price: form.min_price ? Number(form.min_price) : undefined,
            max_price: form.max_price ? Number(form.max_price) : undefined,
          },
          exclude: {
            vendors: splitCsv(form.exclude_vendors),
            brands: splitCsv(form.exclude_brands),
            categories: splitCsv(form.exclude_categories),
            product_ids: splitCsv(form.exclude_product_ids),
          },
        },
        overrides: { pins: splitCsv(form.pins), blocklist: splitCsv(form.blocklist) },
        ranking: {
          boosts: (form.boosts||[]).filter(b=>b.field).map(b=>({ field: b.field, op: b.op as any, value: b.value, weight: Number(b.weight) })),
          penalties: (form.penalties||[]).filter(b=>b.field).map(b=>({ field: b.field, op: b.op as any, value: b.value, weight: Number(b.weight) })),
        },
        diversity: form.diversity_by ? { by: form.diversity_by, max_per_group: form.diversity_max } : undefined,
      };
      if (editing) {
        await updateRule(editing._id, payload);
        toast({ title: 'Règle mise à jour' });
      } else {
        await createRule(payload);
        toast({ title: 'Règle créée' });
      }
      setOpenForm(false);
      await refresh();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Échec', description: 'Action impossible' });
    }
  };

  const onPauseResume = async (r: Rule) => {
    const next = r.mode === 'paused' ? 'active' : 'paused';
    const prev = items;
    setItems(prev.map(i => i._id === r._id ? { ...i, mode: next } as Rule : i));
    try {
      await updateRule(r._id, { mode: next });
      toast({ title: next === 'paused' ? 'Règle mise en pause' : 'Règle activée' });
    } catch (e) {
      setItems(prev); // rollback
      toast({ variant: 'destructive', title: 'Échec', description: 'Impossible de mettre à jour la règle' });
    }
  };

  const onDelete = async (r: Rule) => {
    if (!confirm('Supprimer cette règle ?')) return;
    const prev = items;
    setItems(prev.filter(i => i._id !== r._id));
    try {
      await deleteRule(r._id);
      toast({ title: 'Règle supprimée' });
    } catch (e) {
      setItems(prev);
      toast({ variant: 'destructive', title: 'Échec', description: 'Suppression impossible' });
    }
  };

  const onOpenPreview = (r?: Rule) => {
    setPreviewParams(p => ({ ...p, product_id: '', kind: 'similar' }));
    setPreviewData(null);
    setOpenPreview(true);
  };
  const runPreview = async () => {
    try {
      const res = await previewRule(previewParams);
      setPreviewData({ before: res.before, after: res.after });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Échec de la prévisualisation' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Premium Orchestration */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="relative p-8 glass-card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Settings2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-display-lg font-display text-foreground">
                    Orchestration Métier
                  </h1>
                  <p className="text-body text-muted-foreground">
                    Contrôlez et optimisez l'algorithme de recommandation via des règles business intelligentes
                  </p>
                </div>
              </div>

              {/* Métriques temps réel */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${orchestrationMetrics.healthScore >= 70 ? 'bg-success' : 'bg-warning'} animate-pulse`} />
                  <span className="text-body-sm font-medium text-foreground">
                    {orchestrationMetrics.activeRules} règles actives
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-body-sm text-muted-foreground">
                    +{orchestrationMetrics.estimatedImpact.toFixed(1)}% CTR estimé
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-body-sm text-muted-foreground">
                    {orchestrationMetrics.healthScore}% santé système
                  </span>
                </div>
              </div>
            </div>

            {/* Actions premium */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('builder')}
                className="btn-premium btn-secondary px-6"
              >
                <Brain className="w-4 h-4 mr-2" />
                Rule Builder
              </button>
              
              <button
                onClick={openCreate}
                className="btn-premium btn-primary px-6"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer règle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Premium Orchestration */}
      <div className="glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Navigation tabs premium */}
          <div className="flex items-center gap-2 p-1 bg-surface-tertiary rounded-xl">
            {[
              { key: 'orchestration' as const, label: 'Orchestration', icon: Layers, desc: 'Gestion des règles' },
              { key: 'builder' as const, label: 'Builder', icon: Settings2, desc: 'Créateur visuel' },
              { key: 'insights' as const, label: 'Analytics', icon: BarChart3, desc: 'Performance' },
              { key: 'ai' as const, label: 'IA Assist', icon: Brain, desc: 'Suggestions' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-body-sm font-medium transition-premium ${
                  activeTab === tab.key
                    ? 'bg-surface-primary text-foreground shadow-premium-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <div className="text-left hidden md:block">
                  <div>{tab.label}</div>
                  <div className="text-caption text-muted-foreground">{tab.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Métriques rapides */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-body-sm font-medium text-foreground">{orchestrationMetrics.totalRules}</div>
              <div className="text-caption text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-body-sm font-medium text-success">{orchestrationMetrics.activeRules}</div>
              <div className="text-caption text-muted-foreground">Actives</div>
            </div>
            <div className="text-center">
              <div className="text-body-sm font-medium text-warning">{orchestrationMetrics.draftRules}</div>
              <div className="text-caption text-muted-foreground">Draft</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu basé sur l'onglet actif */}
      {activeTab === 'orchestration' && (
        <OrchestrationTab
          items={displayItems}
          loading={loading}
          view={view}
          setView={setView}
          sort={sort}
          setSort={setSort}
          mode={mode}
          setMode={setMode}
          kind={kind}
          setKind={setKind}
          q={q}
          setQ={setQ}
          refresh={refresh}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          orchestrationMetrics={orchestrationMetrics}
          openEdit={openEdit}
          onPauseResume={onPauseResume}
          onDelete={onDelete}
          onOpenPreview={onOpenPreview}
        />
      )}

      {activeTab === 'builder' && (
        <RuleBuilderTab
          ruleBuilderMode={ruleBuilderMode}
          setRuleBuilderMode={setRuleBuilderMode}
          openCreate={openCreate}
        />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <AnalyticsTab
            items={items}
            insights={insights}
            insightsLoading={insightsLoading}
            insightsRuleId={insightsRuleId}
            setInsightsRuleId={setInsightsRuleId}
            loadInsights={loadInsights}
            orchestrationMetrics={orchestrationMetrics}
          />
        </div>
      )}

      {activeTab === 'ai' && (
        <AIAssistTab
          prefillBoostStockSuggestion={prefillBoostStockSuggestion}
          setEditing={setEditing}
          setForm={setForm}
          defaultForm={defaultForm}
          setOpenForm={setOpenForm}
          setOpenPreview={setOpenPreview}
        />
      )}


      {/* Create / Edit Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing? 'Modifier la règle' : 'Créer une règle'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
              <TabsTrigger value="basics">Général</TabsTrigger>
              <TabsTrigger value="scope">Cible</TabsTrigger>
              <TabsTrigger value="constraints">Contraintes</TabsTrigger>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="overrides">Overrides</TabsTrigger>
              <TabsTrigger value="diversity">Diversité</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Nom</Label>
                  <Input value={form?.name || ''} onChange={e=>upd({ name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm">Priorité (0..100)</Label>
                  <Input type="number" value={form?.priority ?? 50} onChange={e=>upd({ priority: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-sm">Mode</Label>
                  <Select value={form?.mode || 'draft'} onValueChange={(v)=>upd({ mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft','active','paused','archived'].map(m=> (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Description</Label>
                  <Input value={form?.description || ''} onChange={e=>upd({ description: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scope" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Kinds cibles</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span>similar</span><Switch checked={!!form?.kind_similar} onCheckedChange={(v)=>upd({ kind_similar: v })} /></div>
                    <div className="flex items-center justify-between"><span>complementary</span><Switch checked={!!form?.kind_complementary} onCheckedChange={(v)=>upd({ kind_complementary: v })} /></div>
                    <div className="flex items-center justify-between"><span>x-sell</span><Switch checked={!!form?.kind_xsell} onCheckedChange={(v)=>upd({ kind_xsell: v })} /></div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Target category_path (CSV)</Label>
                  <Input value={form?.target_category_path || ''} onChange={e=>upd({ target_category_path: e.target.value })} placeholder="Homme/Chaussures/Running" />
                </div>
                <div>
                  <Label className="text-sm">Target product_ids (CSV)</Label>
                  <Input value={form?.target_product_ids || ''} onChange={e=>upd({ target_product_ids: e.target.value })} placeholder="prod_abc, prod_def" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Include only</Label>
                  <div className="flex items-center justify-between"><span className="text-sm">in_stock</span><Switch checked={!!form?.include_in_stock} onCheckedChange={(v)=>upd({ include_in_stock: v })} /></div>
                  <Input type="number" placeholder="min_price" value={form?.min_price || ''} onChange={e=>upd({ min_price: e.target.value })} />
                  <Input type="number" placeholder="max_price" value={form?.max_price || ''} onChange={e=>upd({ max_price: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm">Exclude vendors (CSV)</Label>
                  <Input value={form?.exclude_vendors || ''} onChange={e=>upd({ exclude_vendors: e.target.value })} placeholder="market_bad" />
                </div>
                <div>
                  <Label className="text-sm">Exclude product_ids (CSV)</Label>
                  <Input value={form?.exclude_product_ids || ''} onChange={e=>upd({ exclude_product_ids: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ranking" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Boosts</Label>
                    <Button size="sm" variant="outline" onClick={()=>upd({ boosts: [ ...(form?.boosts||[]), { field: '', op: 'eq', value: '', weight: 5 } ] })}>+ Ajouter</Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(form?.boosts||[]).map((b, i)=> (
                      <div key={i} className="grid grid-cols-4 gap-2">
                        <Input placeholder="field" value={b.field} onChange={e=>{ const arr=[...(form?.boosts||[])]; arr[i]={ ...arr[i], field: e.target.value }; upd({ boosts: arr }); }} />
                        <Input placeholder="op" value={b.op} onChange={e=>{ const arr=[...(form?.boosts||[])]; arr[i]={ ...arr[i], op: e.target.value }; upd({ boosts: arr }); }} />
                        <Input placeholder="value" value={b.value} onChange={e=>{ const arr=[...(form?.boosts||[])]; arr[i]={ ...arr[i], value: e.target.value }; upd({ boosts: arr }); }} />
                        <Input type="number" placeholder="weight" value={b.weight} onChange={e=>{ const arr=[...(form?.boosts||[])]; arr[i]={ ...arr[i], weight: Number(e.target.value) }; upd({ boosts: arr }); }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Penalties</Label>
                    <Button size="sm" variant="outline" onClick={()=>upd({ penalties: [ ...(form?.penalties||[]), { field: '', op: 'eq', value: '', weight: 5 } ] })}>+ Ajouter</Button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {(form?.penalties||[]).map((b, i)=> (
                      <div key={i} className="grid grid-cols-4 gap-2">
                        <Input placeholder="field" value={b.field} onChange={e=>{ const arr=[...(form?.penalties||[])]; arr[i]={ ...arr[i], field: e.target.value }; upd({ penalties: arr }); }} />
                        <Input placeholder="op" value={b.op} onChange={e=>{ const arr=[...(form?.penalties||[])]; arr[i]={ ...arr[i], op: e.target.value }; upd({ penalties: arr }); }} />
                        <Input placeholder="value" value={b.value} onChange={e=>{ const arr=[...(form?.penalties||[])]; arr[i]={ ...arr[i], value: e.target.value }; upd({ penalties: arr }); }} />
                        <Input type="number" placeholder="weight" value={b.weight} onChange={e=>{ const arr=[...(form?.penalties||[])]; arr[i]={ ...arr[i], weight: Number(e.target.value) }; upd({ penalties: arr }); }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overrides" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Pins (CSV)</Label>
                  <Input value={form?.pins || ''} onChange={e=>upd({ pins: e.target.value })} placeholder="prod_abc123, prod_def456" />
                </div>
                <div>
                  <Label className="text-sm">Blocklist (CSV)</Label>
                  <Input value={form?.blocklist || ''} onChange={e=>upd({ blocklist: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diversity" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Diversité par</Label>
                  <Select value={(form?.diversity_by && form.diversity_by.length>0) ? (form.diversity_by as any) : 'none'} onValueChange={(v)=>upd({ diversity_by: (v === 'none' ? '' : (v as any)) })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      <SelectItem value="brand">brand</SelectItem>
                      <SelectItem value="category">category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Max par groupe</Label>
                  <Input type="number" value={form?.diversity_max ?? 2} onChange={e=>upd({ diversity_max: Number(e.target.value) })} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenForm(false)}>Annuler</Button>
            <Button onClick={submitForm}>{editing?'Enregistrer':'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm text-foreground">Product ID</label>
                <Input value={previewParams.product_id} onChange={e=>setPreviewParams(p=>({ ...p, product_id: e.target.value }))} placeholder="prod_..." />
              </div>
              <div>
                <label className="text-sm text-foreground">Kind</label>
                <Select value={previewParams.kind} onValueChange={(v)=>setPreviewParams(p=>({ ...p, kind: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="similar">similar</SelectItem>
                    <SelectItem value="complementary">complementary</SelectItem>
                    <SelectItem value="x-sell">x-sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={runPreview}>Preview</Button>
            </div>
            {previewData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Avant</div>
                  <div className="space-y-2">
                    {previewData.before.map((it:any, i:number)=> (
                      <div key={i} className="p-3 border border-border rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded" />
                        <div className="text-sm text-foreground">{it.name || it.product_id}</div>
                        <div className="ml-auto text-xs text-muted-foreground">{Math.round((it.score||0)*100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Après</div>
                  <div className="space-y-2">
                    {previewData.after.map((it:any, i:number)=> (
                      <div key={i} className="p-3 border border-border rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded" />
                        <div className="text-sm text-foreground">{it.name || it.product_id}</div>
                        <div className="ml-auto text-xs text-muted-foreground">{Math.round((it.score||0)*100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setOpenPreview(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


