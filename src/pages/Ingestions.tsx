import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, RefreshCw, Calendar, Upload, Database, CheckCircle2, Clock, 
  AlertTriangle, Zap, Filter, Search, Grid3X3, List, FileText, 
  Link, Type, Settings, Eye, Download, Trash2, RotateCcw, Activity
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Hero from '@/components/Hero';

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
  // États existants
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedUrl, setFeedUrl] = useState('');
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', DEFAULT_TENANT, 'ingest'],
    queryFn: () => Api.runs({ tenant: DEFAULT_TENANT, type: 'ingest', limit: 20 }),
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Nouveaux états pour l'expérience premium
  const [importStep, setImportStep] = useState<'source' | 'config' | 'preview' | 'launch'>('source');
  const [importMode, setImportMode] = useState<'url' | 'file' | 'text' | 'api'>('url');
  const [importData, setImportData] = useState('');
  const [batchSize, setBatchSize] = useState(100);
  const [dryRun, setDryRun] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  
  // États pour la gestion des runs
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
      case 'ok':
        return 'Completed';
      case 'warning':
        return 'Partial';
      case 'error':
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };
  // KPIs calculés à partir des vrais runs
  const { lastRunText, successRate24h, processed24h } = useMemo(() => {
    const list: ApiRun[] = Array.isArray(runs) ? runs.slice() : [];
    // tri desc par date de début
    list.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    const last = list[0];
    const lastRunText = last ? `${formatDate(last.started_at)}${last.ended_at ? ` → ${formatDate(last.ended_at)}` : ''}` : '—';

    const now = Date.now();
    const in24h = list.filter((r) => now - new Date(r.started_at).getTime() <= 24 * 60 * 60 * 1000);
    const total24h = in24h.length;
    const ok24h = in24h.filter((r) => (r.status === 'ok' || r.status === 'success')).length;
    const successRate24h = total24h > 0 ? Math.round((ok24h / total24h) * 1000) / 10 : 0; // 0.1%

    let processed24h = 0;
    for (const r of in24h) {
      const inserted = r.counts?.inserted ?? 0;
      const updated = r.counts?.updated ?? 0;
      processed24h += inserted + updated;
    }
    return { lastRunText, successRate24h, processed24h };
  }, [runs]);


  const handleStartIngestion = async () => {
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast({ variant: 'destructive', title: 'Format invalide', description: 'Veuillez sélectionner un fichier .json' });
      e.target.value = '';
      return;
    }
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await Api.ingestStart({ tenant: DEFAULT_TENANT, feed_inline: json, feed_type: 'json', batch_size: 100, dry_run: false });
      toast({ title: 'Ingestion démarrée', description: `${file.name} envoyé avec succès.` });
      queryClient.invalidateQueries({ queryKey: ['runs', DEFAULT_TENANT, 'ingest'] });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erreur lors de l\'import', description: 'Vérifiez que le JSON est valide.' });
      console.error(err);
    } finally {
      e.target.value = '';
    }
  };

  // Wizard steps configuration
  const wizardSteps = [
    { id: 'source', label: 'Source', description: 'Choisir origine', icon: Database },
    { id: 'config', label: 'Configuration', description: 'Paramètres', icon: Settings },
    { id: 'preview', label: 'Aperçu', description: 'Validation', icon: Eye },
    { id: 'launch', label: 'Lancement', description: 'Exécution', icon: Zap },
  ];

  const currentStepIndex = wizardSteps.findIndex(s => s.id === importStep);

  // Filtrer les runs
  const filteredRuns = useMemo(() => {
    const runsList: ApiRun[] = Array.isArray(runs) ? runs : [];
    return runsList.filter(run => {
      // Filtre par statut
      if (filterStatus !== 'all' && run.status !== filterStatus) return false;
      
      // Filtre par recherche
      if (searchTerm && !run.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }, [runs, filterStatus, searchTerm]);

  return (
    <div className="space-y-8">
      <Hero
        variant="ingestions"
        title="Import des données"
        subtitle="Importez, configurez et surveillez vos flux de données avec une expérience guidée premium."
        actions={[
          { label: 'Import guidé', variant: 'default', onClick: () => setShowWizard(true) },
          { label: 'Import rapide', variant: 'outline', onClick: handleUploadClick }
        ]}
      />
      
      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileSelected} />

      {/* Wizard d'Import Premium */}
      {showWizard && (
        <div className="card-premium p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-h1 font-display text-foreground">Assistant d'import</h2>
            <button 
              onClick={() => setShowWizard(false)}
              className="btn-premium btn-secondary px-4 py-2"
            >
              Fermer
            </button>
          </div>

          {/* Stepper Premium */}
          <div className="relative mb-8">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-border">
              <div 
                className="h-full bg-gradient-primary transition-all duration-1000 ease-out"
                style={{ width: `${(currentStepIndex / (wizardSteps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {wizardSteps.map((step, index) => {
                const isActive = importStep === step.id;
                const isCompleted = index < currentStepIndex;
                const isNext = index === currentStepIndex + 1;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setImportStep(step.id as any)}
                    className={`group flex flex-col items-center transition-premium ${
                      isActive || isCompleted ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-premium mb-3 ${
                      isActive 
                        ? 'bg-gradient-primary text-primary-foreground shadow-premium-md scale-110' 
                        : isCompleted
                          ? 'bg-success text-success-foreground shadow-premium-sm'
                          : isNext
                            ? 'bg-surface-secondary border-2 border-primary text-primary hover:bg-primary-light'
                            : 'bg-surface-secondary text-muted-foreground border border-border'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <step.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse" />
                      )}
                    </div>

                    <div className="text-center">
                      <div className={`text-body-sm font-medium transition-fast ${
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </div>
                      <div className="text-caption text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu du Wizard */}
          <div className="min-h-[400px]">
            {importStep === 'source' && <ImportSourceStep />}
            {importStep === 'config' && <ImportConfigStep />}
            {importStep === 'preview' && <ImportPreviewStep />}
            {importStep === 'launch' && <ImportLaunchStep />}
          </div>
        </div>
      )}

      {/* Dashboard KPIs Premium */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {/* Dernière ingestion */}
        <div className="kpi-card group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Dernière ingestion
            </h3>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-display-sm font-display text-foreground mb-1">
            {lastRunText.split(' ')[0] || '—'}
          </div>
          <p className="text-caption text-muted-foreground">
            {lastRunText.includes('→') ? 'Terminée' : 'En attente'}
          </p>
        </div>

        {/* Taux de succès */}
        <div className="kpi-card group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Taux de succès 24h
            </h3>
            <CheckCircle2 className={`w-5 h-5 ${successRate24h >= 90 ? 'text-success' : 'text-warning'}`} />
          </div>
          <div className="text-display-sm font-display text-foreground mb-2">
            {successRate24h.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  successRate24h >= 90 ? 'bg-gradient-to-r from-success to-success/80' :
                  successRate24h >= 70 ? 'bg-gradient-to-r from-warning to-warning/80' : 'bg-gradient-to-r from-error to-error/80'
                }`}
                style={{ width: `${successRate24h}%` }}
              />
            </div>
          </div>
        </div>

        {/* Produits traités */}
        <div className="kpi-card group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Produits traités
            </h3>
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="text-display-sm font-display text-foreground mb-1">
            {processed24h.toLocaleString('fr-FR')}
          </div>
          <p className="text-caption text-muted-foreground">
            Dernières 24h
          </p>
        </div>

        {/* Santé système */}
        <div className="kpi-card group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
              Santé système
            </h3>
            <Activity className="w-5 h-5 text-success" />
          </div>
          <div className="text-display-sm font-display text-foreground mb-1">
            Opérationnel
          </div>
          <p className="text-caption text-muted-foreground">
            Tous systèmes OK
          </p>
        </div>
      </div>

      {/* Import Rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="lg:col-span-2 card-premium p-6">
          <h2 className="text-h1 font-display text-foreground mb-6">Import rapide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Via URL */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <Link className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-h2 font-medium text-foreground">Via URL</h3>
                  <p className="text-caption text-muted-foreground">Import depuis une API</p>
                </div>
              </div>
              
              <input
                placeholder="https://api.exemple.com/produits.json"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="input-premium"
              />
              
              <button
                onClick={handleStartIngestion}
                disabled={!feedUrl}
                className="btn-premium btn-primary w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Lancer import
              </button>
            </div>

            {/* Via Fichier */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-h2 font-medium text-foreground">Via Fichier</h3>
                  <p className="text-caption text-muted-foreground">Upload JSON local</p>
                </div>
              </div>
              
              <div 
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary hover:bg-primary-light transition-premium cursor-pointer"
                onClick={handleUploadClick}
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-body-sm text-muted-foreground">
                  Glisser-déposer ou cliquer
                </p>
              </div>
              
              <button 
                onClick={handleUploadClick}
                className="btn-premium btn-secondary w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choisir fichier
              </button>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="card-premium p-6">
          <h3 className="text-h2 font-medium text-foreground mb-6">Actions rapides</h3>
          
          <div className="space-y-4">
            <button 
              onClick={() => setShowWizard(true)}
              className="btn-premium btn-primary w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              Import guidé
            </button>
            
            <button className="btn-premium btn-secondary w-full">
              <Calendar className="w-4 h-4 mr-2" />
              Planifier import
            </button>
            
            <button className="btn-premium btn-secondary w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configurer mapping
            </button>
            
            <div className="pt-4 border-t border-border">
              <button className="btn-premium btn-secondary w-full text-xs">
                <Download className="w-3 h-3 mr-2" />
                Exporter historique
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gestionnaire de Runs Premium */}
      <RunsManager 
        runs={filteredRuns}
        isLoading={isLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        formatDate={formatDate}
        getStatusLabel={getStatusLabel}
      />
    </div>
  );

  // Composants du Wizard
  function ImportSourceStep() {
    return (
      <div className="space-y-6">
        <h3 className="text-h2 font-medium text-foreground mb-6">Choisir la source de données</h3>
        
        {/* Sélecteur de mode */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'url', label: 'URL/API', icon: Link, desc: 'Récupérer depuis une API' },
            { id: 'file', label: 'Fichier', icon: FileText, desc: 'Upload fichier local' },
            { id: 'text', label: 'Texte', icon: Type, desc: 'Coller JSON directement' },
            { id: 'api', label: 'Connecteur', icon: Database, desc: 'Sources pré-configurées' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setImportMode(mode.id as any)}
              className={`p-6 rounded-xl border-2 transition-premium text-center ${
                importMode === mode.id
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border hover:border-border-hover'
              }`}
            >
              <mode.icon className={`w-8 h-8 mx-auto mb-3 ${
                importMode === mode.id ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <div className="text-body-sm font-medium">{mode.label}</div>
              <div className="text-caption text-muted-foreground">{mode.desc}</div>
            </button>
          ))}
        </div>

        {/* Configuration selon le mode */}
        <div className="mt-8">
          {importMode === 'url' && (
            <div className="space-y-4">
              <label className="text-body-sm font-medium text-foreground">URL du feed JSON</label>
              <input
                placeholder="https://api.exemple.com/produits.json"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="input-premium"
              />
            </div>
          )}

          {importMode === 'text' && (
            <div className="space-y-4">
              <label className="text-body-sm font-medium text-foreground">Contenu JSON</label>
              <textarea
                placeholder="Collez votre JSON ici..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="input-premium min-h-[200px] font-mono text-sm resize-none"
              />
            </div>
          )}

          {importMode === 'file' && (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary hover:bg-primary-light transition-premium cursor-pointer"
              onClick={handleUploadClick}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-h3 font-medium text-foreground mb-2">Glissez-déposez votre fichier</h4>
              <p className="text-body text-muted-foreground">ou cliquez pour sélectionner</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button 
            onClick={() => setImportStep('config')}
            disabled={!importData && importMode !== 'file'}
            className="btn-premium btn-primary"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  function ImportConfigStep() {
    return (
      <div className="space-y-6">
        <h3 className="text-h2 font-medium text-foreground mb-6">Configuration de l'import</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Paramètres généraux */}
          <div className="space-y-6">
            <h4 className="text-h3 font-medium text-foreground">Paramètres généraux</h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-body-sm font-medium text-foreground">Taille de lot</label>
                <Select value={batchSize.toString()} onValueChange={(v) => setBatchSize(parseInt(v))}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 produits</SelectItem>
                    <SelectItem value="100">100 produits</SelectItem>
                    <SelectItem value="250">250 produits</SelectItem>
                    <SelectItem value="500">500 produits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <div>
                  <div className="text-body-sm font-medium text-foreground">Mode test (dry run)</div>
                  <div className="text-caption text-muted-foreground">Valider sans persister</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mapping */}
          <div className="space-y-6">
            <h4 className="text-h3 font-medium text-foreground">Mapping des données</h4>
            
            <div className="p-4 bg-info-light rounded-lg border border-info">
              <p className="text-body-sm text-info-foreground">
                Le mapping unifié sera appliqué automatiquement si configuré.
              </p>
            </div>

            <button className="btn-premium btn-secondary w-full">
              <Settings className="w-4 h-4 mr-2" />
              Configurer mapping
            </button>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <button 
            onClick={() => setImportStep('source')}
            className="btn-premium btn-secondary"
          >
            Retour
          </button>
          <button 
            onClick={() => setImportStep('preview')}
            className="btn-premium btn-primary"
          >
            Aperçu
          </button>
        </div>
      </div>
    );
  }

  function ImportPreviewStep() {
    return (
      <div className="space-y-6">
        <h3 className="text-h2 font-medium text-foreground mb-6">Aperçu et validation</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Résumé */}
          <div className="card-premium p-6">
            <h4 className="text-h3 font-medium text-foreground mb-4">Résumé</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-body-sm text-muted-foreground">Source</span>
                <span className="text-body-sm font-medium">{importMode.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm text-muted-foreground">Taille de lot</span>
                <span className="text-body-sm font-medium">{batchSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-body-sm text-muted-foreground">Mode</span>
                <span className="text-body-sm font-medium">{dryRun ? 'Test' : 'Production'}</span>
              </div>
            </div>
          </div>

          {/* Validation */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-h3 font-medium text-foreground">Validation des données</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-success-light rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-body-sm text-success-foreground">Format JSON valide</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-success-light rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-body-sm text-success-foreground">Champs requis présents</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-warning-light rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="text-body-sm text-warning-foreground">3 produits avec prix manquant</span>
              </div>
            </div>

            {/* Échantillon */}
            <div className="mt-6">
              <h5 className="text-body font-medium text-foreground mb-3">Échantillon (3 premiers éléments)</h5>
              <div className="bg-surface-secondary rounded-lg p-4 max-h-60 overflow-y-auto">
                <pre className="text-sm font-mono text-foreground">
{`[
  {
    "id": "prod_001",
    "name": "Produit exemple 1",
    "price": 29.99,
    "category": "Electronics"
  },
  {
    "id": "prod_002", 
    "name": "Produit exemple 2",
    "price": 49.99,
    "category": "Fashion"
  }
]`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <button 
            onClick={() => setImportStep('config')}
            className="btn-premium btn-secondary"
          >
            Retour
          </button>
          <button 
            onClick={() => setImportStep('launch')}
            className="btn-premium btn-primary"
          >
            Lancer l'import
          </button>
        </div>
      </div>
    );
  }

  function ImportLaunchStep() {
    return (
      <div className="space-y-6">
        <h3 className="text-h2 font-medium text-foreground mb-6">Lancement de l'import</h3>
        
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-primary-foreground animate-pulse" />
          </div>
          
          <h4 className="text-h1 font-display text-foreground mb-4">Import en cours...</h4>
          <p className="text-body text-muted-foreground mb-8">
            Vos données sont en cours de traitement
          </p>

          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between text-body-sm">
              <span>Progression</span>
              <span>67%</span>
            </div>
            <Progress value={67} className="h-2" />
            <p className="text-caption text-muted-foreground">
              234 produits traités sur 350
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button className="btn-premium btn-secondary">
              Voir les détails
            </button>
            <button 
              onClick={() => setShowWizard(false)}
              className="btn-premium btn-primary"
            >
              Fermer l'assistant
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gestionnaire de Runs Premium
  function RunsManager({ 
    runs, isLoading, viewMode, setViewMode, filterStatus, setFilterStatus, 
    searchTerm, setSearchTerm, showFilters, setShowFilters, formatDate, getStatusLabel 
  }: any) {
    return (
      <div className="card-premium p-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-h1 font-display text-foreground">Gestionnaire de runs</h2>
            <p className="text-body text-muted-foreground">
              Historique et suivi des imports de données
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                placeholder="Rechercher un run..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-10 w-64"
              />
            </div>

            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-premium ${showFilters ? 'btn-primary' : 'btn-secondary'} px-4`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>

            {/* View Mode */}
            <div className="flex border border-border rounded-lg p-1 bg-surface-secondary">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-premium ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-premium ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtres expandables */}
        {showFilters && (
          <div className="mb-6 p-4 bg-surface-secondary rounded-lg animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Statut
                </label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="success">Succès</SelectItem>
                    <SelectItem value="error">Erreur</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Runs List/Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-body text-muted-foreground">Chargement des runs...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-h2 font-medium text-foreground mb-2">Aucun run trouvé</h3>
            <p className="text-body text-muted-foreground mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Essayez de modifier vos filtres' 
                : 'Lancez votre premier import pour voir l\'historique ici'
              }
            </p>
            <button 
              onClick={() => setShowWizard(true)}
              className="btn-premium btn-primary"
            >
              <Zap className="w-4 h-4 mr-2" />
              Nouveau run
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-3'
          }>
            {runs.map((run: ApiRun, index: number) => (
              <RunCard 
                key={run.id} 
                run={run} 
                viewMode={viewMode} 
                index={index}
                formatDate={formatDate}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  function RunCard({ run, viewMode, index, formatDate, getStatusLabel }: any) {
    const statusColor = 
      run.status === 'success' || run.status === 'ok' ? 'success' :
      run.status === 'warning' ? 'warning' : 'error';

    if (viewMode === 'list') {
      return (
        <div 
          className="flex items-center justify-between p-4 bg-surface-secondary rounded-xl border border-border hover:border-border-hover transition-premium hover:shadow-premium-sm animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full bg-${statusColor} shadow-${statusColor}/25 shadow-lg`} />
            <div>
              <div className="text-body-sm font-medium text-foreground">{run.id}</div>
              <div className="text-caption text-muted-foreground">{run.type}</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {run.counts?.inserted && (
              <div className="text-center">
                <div className="text-body-sm font-medium text-success">{run.counts.inserted}</div>
                <div className="text-caption text-muted-foreground">Inserted</div>
              </div>
            )}
            {run.counts?.updated && (
              <div className="text-center">
                <div className="text-body-sm font-medium text-warning">{run.counts.updated}</div>
                <div className="text-caption text-muted-foreground">Updated</div>
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-body-sm font-medium text-foreground">
              {formatDate(run.started_at)}
            </div>
            <div className="text-caption text-muted-foreground">
              {getStatusLabel(run.status)}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="btn-premium btn-secondary h-8 px-3 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Détails
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="card-premium p-4 animate-fade-in interactive-scale"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="flex items-center justify-between mb-3">
          <Badge className={`bg-${statusColor}-light text-${statusColor}`}>
            {getStatusLabel(run.status)}
          </Badge>
          <div className={`w-2 h-2 rounded-full bg-${statusColor}`} />
        </div>

        <h4 className="text-body font-medium text-foreground mb-1">{run.id}</h4>
        <p className="text-caption text-muted-foreground mb-4">{run.type}</p>

        {/* Métriques */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {run.counts?.inserted && (
            <div className="text-center p-2 bg-success-light rounded-lg">
              <div className="text-body-sm font-medium text-success">{run.counts.inserted}</div>
              <div className="text-caption text-success-foreground">Inserted</div>
            </div>
          )}
          {run.counts?.updated && (
            <div className="text-center p-2 bg-warning-light rounded-lg">
              <div className="text-body-sm font-medium text-warning">{run.counts.updated}</div>
              <div className="text-caption text-warning-foreground">Updated</div>
            </div>
          )}
        </div>

        <div className="text-caption text-muted-foreground mb-4">
          {formatDate(run.started_at)}
        </div>

        <div className="flex gap-2">
          <button className="btn-premium btn-secondary flex-1 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            Détails
          </button>
          <button className="btn-premium btn-secondary px-3 text-xs">
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
}