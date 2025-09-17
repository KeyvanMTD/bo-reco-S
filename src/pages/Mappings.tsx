import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { unifiedProductSchema } from '@/schemas/unifiedProduct';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { ArrowRight, Save, RotateCcw, Upload, Check, FileText, Sparkles, ArrowRightLeft, Eye, CheckCircle2, Database, Lightbulb, Zap, Type, Link } from 'lucide-react';
import Hero from '@/components/Hero';

export default function Mappings() {
  const { toast } = useToast();

  const [step, setStep] = useState<'import' | 'suggest' | 'map' | 'validate' | 'publish'>('import');
  const [sampleText, setSampleText] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sourceFields, setSourceFields] = useState<Array<{ id: string; type: string }>>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'text' | 'url'>('file');

  const requiredUnified = useMemo(() => unifiedProductSchema.filter(f => f.required).map(f => f.id), []);
  const requiredCoverage = useMemo(() => {
    if (requiredUnified.length === 0) return 0;
    const covered = requiredUnified.filter(id => Object.values(mappings).includes(id)).length;
    return Math.round((covered / requiredUnified.length) * 100);
  }, [mappings, requiredUnified]);

  const parseSample = () => {
    try {
      const json = JSON.parse(sampleText);
      let record: any | null = null;
      if (Array.isArray(json) && typeof json[0] === 'object') {
        record = json[0];
      } else if (json && typeof json === 'object') {
        const entries = Object.entries(json as Record<string, unknown>);
        const preferred = entries.find(([k, v]) => k === 'products' && Array.isArray(v) && typeof (v as any[])[0] === 'object');
        const firstArrayObj = preferred || entries.find(([_, v]) => Array.isArray(v) && typeof (v as any[])[0] === 'object');
        if (firstArrayObj) {
          record = (firstArrayObj[1] as any[])[0];
        } else if (entries.length > 0) {
          record = json;
        }
      }

      if (!record || typeof record !== 'object') return setSourceFields([]);
      const fields: Array<{ id: string; type: string }> = Object.entries(record).map(([k, v]) => ({ id: k, type: Array.isArray(v) ? 'array' : typeof v }));
      setSourceFields(fields);
      const auto: Record<string, string> = {};
      fields.forEach(f => {
        const hit = unifiedProductSchema.find(u => u.id === f.id);
        if (hit) auto[f.id] = hit.id;
      });
      setMappings(prev => ({ ...auto, ...prev }));
      setStep('suggest');
    } catch {
      setSourceFields([]);
      toast({ variant: 'destructive', title: 'JSON invalide', description: 'Vérifiez votre échantillon.' });
    }
  };

  const previewRows = useMemo(() => {
    try {
      const json = JSON.parse(sampleText);
      let arr: any[] = [];
      if (Array.isArray(json) && typeof json[0] === 'object') {
        arr = json.slice(0, 5);
      } else if (json && typeof json === 'object') {
        const entries = Object.entries(json as Record<string, unknown>);
        const preferred = entries.find(([k, v]) => k === 'products' && Array.isArray(v) && typeof (v as any[])[0] === 'object');
        const firstArrayObj = preferred || entries.find(([_, v]) => Array.isArray(v) && typeof (v as any[])[0] === 'object');
        if (firstArrayObj) arr = (firstArrayObj[1] as any[]).slice(0, 5);
        else arr = [json];
      }
      return arr.map((row: any) => {
        const out: any = {};
        Object.entries(mappings).forEach(([src, dst]) => {
          if (dst) out[dst] = row[src];
        });
        return { src: row, dst: out };
      });
    } catch {
      return [];
    }
  }, [sampleText, mappings]);

  const resetMappings = () => setMappings({});

  const saveMapping = async () => {
    setSaving(true);
    try {
      await Api.mappingsSave({ tenant: DEFAULT_TENANT, status: 'active', schema: 'unified_product_v1', mappings, transforms: {} });
      toast({ title: 'Mapping sauvegardé', description: 'Version active mise à jour.' });
      setStep('publish');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erreur de sauvegarde', description: 'Réessayez plus tard.' });
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 'import', label: 'Importer', description: 'Charger les données', icon: FileText },
    { id: 'suggest', label: 'Suggestions', description: 'IA mapping', icon: Sparkles },
    { id: 'map', label: 'Mapping', description: 'Correspondances', icon: ArrowRightLeft },
    { id: 'validate', label: 'Validation', description: 'Vérification', icon: Eye },
    { id: 'publish', label: 'Publication', description: 'Activation', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="space-y-8">
      <Hero
        title="Mapping des données"
        subtitle="Transformez vos données sources en schéma unifié avec l'assistance de l'IA."
        actions={[
          { label: 'Documentation', variant: 'outline' },
          { label: 'Schéma unifié', variant: 'outline' }
        ]}
        variant="preview"
      />

      {/* Premium Stepper */}
      <div className="card-premium p-8 animate-fade-in">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-border">
            <div 
              className="h-full bg-gradient-primary transition-all duration-1000 ease-out"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((stepItem, index) => {
              const isActive = step === stepItem.id;
              const isCompleted = index < currentStepIndex;
              const isNext = index === currentStepIndex + 1;
              
              return (
                <button
                  key={stepItem.id}
                  onClick={() => setStep(stepItem.id as any)}
                  className={`group flex flex-col items-center transition-premium ${
                    isActive || isCompleted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* Step Circle */}
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
                      <Check className="w-6 h-6" />
                    ) : (
                      <stepItem.icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                    
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-primary/20 animate-pulse" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="text-center">
                    <div className={`text-body-sm font-medium transition-fast ${
                      isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                    }`}>
                      {stepItem.label}
                    </div>
                    <div className="text-caption text-muted-foreground">
                      {stepItem.description}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
        </div>
      </div>

      {/* Premium KPIs Dashboard */}
      <div className="sticky top-20 z-10 glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Champs détectés */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Champs détectés
              </h3>
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="text-display-sm font-display text-foreground mb-1">
              {sourceFields.length}
            </div>
            <p className="text-caption text-muted-foreground">
              {sourceFields.length > 0 ? 'Prêt pour mapping' : 'En attente d\'import'}
            </p>
          </div>

          {/* Coverage obligatoire */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Couverture requise
              </h3>
              <CheckCircle2 className={`w-5 h-5 ${requiredCoverage >= 100 ? 'text-success' : 'text-warning'}`} />
            </div>
            <div className="text-display-sm font-display text-foreground mb-2">
              {requiredCoverage}%
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${
                    requiredCoverage >= 100 ? 'bg-gradient-to-r from-success to-success/80' :
                    requiredCoverage >= 50 ? 'bg-gradient-to-r from-warning to-warning/80' : 'bg-gradient-to-r from-error to-error/80'
                  }`}
                  style={{ width: `${requiredCoverage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Champs restants */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">
                Non mappés
              </h3>
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-display-sm font-display text-foreground mb-1">
              {Math.max(0, sourceFields.length - Object.values(mappings).filter(Boolean).length)}
            </div>
            <p className="text-caption text-muted-foreground">
              Restants à mapper
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => {
                try {
                  if (sourceFields.length === 0) { parseSample(); }
                  const suggestPayload = {
                    tenant: DEFAULT_TENANT,
                    source_fields: sourceFields.map(f => ({ name: f.id, type: f.type })),
                    unified_schema: unifiedProductSchema.map(u => ({ id: u.id, label: u.label, type: u.type, required: u.required, description: u.description })),
                    locale: 'fr-FR',
                  };
                  const res = await Api.mappingSuggest(suggestPayload);
                  const next: Record<string, string> = { ...mappings };
                  res.suggestions?.forEach(s => { if (s.source && s.target) next[s.source] = s.target; });
                  setMappings(next);
                  toast({ title: 'Suggestions appliquées', description: 'Vérifiez et ajustez si besoin.' });
                  setStep('map');
                } catch (e) {
                  toast({ variant: 'destructive', title: 'Échec des suggestions', description: 'Vérifiez le webhook IA.' });
                  console.error(e);
                }
              }}
              className="btn-premium btn-primary h-10"
              disabled={sourceFields.length === 0}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              IA Mapping
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={resetMappings}
                className="btn-premium btn-secondary flex-1 h-9 px-3"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
            Reset
              </button>
              
              <button
                onClick={saveMapping}
                disabled={saving || Object.keys(mappings).length === 0}
                className="btn-premium btn-primary flex-1 h-9 px-3"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Sauvegarde...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Étape Import Premium */}
      {step === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
          {/* Zone Import Premium avec Onglets */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-premium p-8">
              <h2 className="text-h1 font-display text-foreground mb-6">
                Importer vos données
              </h2>

              {/* Onglets d'import */}
              <div className="flex gap-2 mb-6 p-1 bg-surface-tertiary rounded-xl">
                <button
                  onClick={() => setImportMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-body-sm font-medium transition-premium ${
                    importMode === 'file'
                      ? 'bg-surface-primary text-foreground shadow-premium-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Fichier
                </button>
                
                <button
                  onClick={() => setImportMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-body-sm font-medium transition-premium ${
                    importMode === 'text'
                      ? 'bg-surface-primary text-foreground shadow-premium-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  Texte
                </button>
                
                <button
                  onClick={() => setImportMode('url')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-body-sm font-medium transition-premium ${
                    importMode === 'url'
                      ? 'bg-surface-primary text-foreground shadow-premium-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  URL
                </button>
              </div>

              {/* Contenu selon l'onglet */}
              {importMode === 'file' && (
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-premium ${
                    sampleText 
                      ? 'border-success bg-success-light/50' 
                      : 'border-border bg-gradient-subtle hover:border-primary hover:bg-primary-light'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-primary', 'bg-primary-light', 'scale-102');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary-light', 'scale-102');
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary-light', 'scale-102');
                    const f = e.dataTransfer.files?.[0];
                    if (!f) return;
                    const text = await f.text();
                    setSampleText(text);
                    parseSample();
                    toast({ title: 'Fichier importé', description: 'Données analysées avec succès.' });
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-primary-foreground" />
                    </div>
                    
                    <div>
                      <h3 className="text-h2 font-medium text-foreground mb-2">
                        {sampleText ? 'Fichier importé' : 'Glissez-déposez votre fichier JSON'}
                      </h3>
                      <p className="text-body text-muted-foreground mb-4">
                        {sampleText 
                          ? 'Prêt pour l\'analyse' 
                          : 'Ou cliquez pour sélectionner un fichier'
                        }
                      </p>
                    </div>

                    <div className="flex justify-center gap-3">
                      <input 
                        ref={fileInputRef} 
                        type="file" 
                        accept="application/json,.json" 
                        className="hidden" 
                        onChange={async (e) => {
                          const f = e.target.files?.[0]; 
                          if (!f) return; 
                          const text = await f.text(); 
                          setSampleText(text); 
                          parseSample(); 
                          e.target.value = '';
                          toast({ title: 'Fichier chargé', description: 'Analyse en cours...' });
                        }} 
                      />
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-premium btn-primary"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choisir un fichier
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {importMode === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                      <Type className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-h2 font-medium text-foreground">Coller votre JSON</h3>
                      <p className="text-caption text-muted-foreground">Collez directement votre JSON dans l'éditeur</p>
                    </div>
                  </div>
                  
                  <textarea 
                    value={sampleText} 
                    onChange={(e) => setSampleText(e.target.value)} 
                    className="input-premium min-h-[300px] font-mono text-sm resize-none"
                    placeholder={`Collez votre JSON ici, par exemple :

{
  "products": [
    {
      "id": "123",
      "name": "Produit exemple",
      "price": 29.99,
      "brand": "Ma Marque"
    }
  ]
}`}
                  />
                  
                  {sampleText && (
                    <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                      <div className="text-body-sm text-muted-foreground">
                        {sampleText.length} caractères
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSampleText('');
                            setSourceFields([]);
                            setMappings({});
                          }}
                          className="btn-premium btn-secondary h-8 px-3 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Effacer
                        </button>
                        
                        <button
                          onClick={() => {
                            parseSample();
                            if (sourceFields.length > 0) {
                              setStep('suggest');
                            }
                          }}
                          className="btn-premium btn-primary h-8 px-3 text-xs"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Analyser
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importMode === 'url' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                      <Link className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-h2 font-medium text-foreground">Importer depuis une URL</h3>
                      <p className="text-caption text-muted-foreground">Récupérer du JSON depuis une API</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="https://api.exemple.com/produits.json"
                      className="input-premium h-12"
                    />
                    
                    <button className="btn-premium btn-primary w-full">
                      <Link className="w-4 h-4 mr-2" />
                      Récupérer les données
                    </button>
                  </div>

                  <div className="p-4 bg-info-light rounded-lg border border-info">
                    <p className="text-body-sm text-info-foreground">
                      <strong>Note :</strong> L'URL doit retourner du JSON valide et être accessible publiquement.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions générales */}
              {sampleText && (
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
                  <button
                    onClick={() => {
                      parseSample();
                      if (sourceFields.length > 0) {
                        setStep('suggest');
                      }
                    }}
                    className="btn-premium btn-primary"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Analyser et continuer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel Champs Détectés Premium */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-secondary rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-h2 font-medium text-foreground">Champs détectés</h3>
                <p className="text-caption text-muted-foreground">Structure des données</p>
              </div>
            </div>

            {sourceFields.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-body text-muted-foreground mb-2">Aucun champ détecté</p>
                <p className="text-body-sm text-muted-foreground">
                  Importez un fichier JSON pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search & Progress */}
            <div className="space-y-4">
                  <input
                    placeholder="Filtrer les champs..."
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="input-premium h-9 text-body-sm"
                  />
                  
                  <div className="flex items-center gap-3">
                    <span className="text-caption text-muted-foreground whitespace-nowrap">
                      Progression
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-1000"
                        style={{ width: `${sourceFields.length === 0 ? 0 : (Object.values(mappings).filter(Boolean).length / sourceFields.length) * 100}%` }}
                      />
                  </div>
                    <span className="text-caption text-muted-foreground whitespace-nowrap">
                      {sourceFields.length === 0 ? 0 : Math.round((Object.values(mappings).filter(Boolean).length / sourceFields.length) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Fields List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sourceFields
                    .filter(f => f.id.toLowerCase().includes(sourceFilter.toLowerCase()))
                    .map((field, index) => (
                      <div 
                        key={field.id} 
                        className={`p-4 rounded-xl border transition-premium hover:shadow-premium-sm ${
                          mappings[field.id] 
                            ? 'border-success bg-success-light text-success-foreground' 
                            : 'border-border bg-surface-secondary hover:border-border-hover'
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${
                              mappings[field.id] ? 'bg-success' : 'bg-muted-foreground'
                            }`} />
                            <div className="font-medium text-foreground truncate" title={field.id}>
                              {field.id}
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              field.type === 'string' ? 'border-orange-200 bg-orange-50 text-orange-700' :
                              field.type === 'number' ? 'border-green-200 bg-green-50 text-green-700' :
                              field.type === 'array' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                              'border-gray-200 bg-gray-50 text-gray-700'
                            }`}
                          >
                            {field.type}
                          </Badge>
                        </div>
                        
                        {mappings[field.id] && (
                          <div className="mt-2 text-caption text-success">
                            → {unifiedProductSchema.find(u => u.id === mappings[field.id])?.label || mappings[field.id]}
                          </div>
                        )}
                </div>
              ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Étape Mapping */}
      {(step === 'map' || step === 'suggest') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Correspondances */}
          <Card className="overflow-hidden shadow-sm lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold text-foreground">Correspondances</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={showUnmappedOnly? 'default':'outline'} onClick={()=>setShowUnmappedOnly(v=>!v)}>
                    {showUnmappedOnly ? 'Afficher tout' : 'Non mappés seulement'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sourceFields.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Chargez un échantillon pour commencer</div>
                ) : (
                  sourceFields.filter(f=> f.id.toLowerCase().includes(sourceFilter.toLowerCase()) && (!showUnmappedOnly || !mappings[f.id])).map((f) => (
                    <div key={f.id} className="flex items-center gap-3">
                      <div className="flex-1 text-sm font-medium text-foreground truncate" title={f.id}>{f.id}</div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <Select
                          value={mappings[f.id] && mappings[f.id].length > 0 ? mappings[f.id] : 'none'}
                          onValueChange={(v)=> setMappings(prev => { const next = { ...prev }; if (v === 'none') { delete next[f.id]; } else { next[f.id] = v; } return next; })}
                        >
                          <SelectTrigger className="w-full h-9"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem key="none" value="none">—</SelectItem>
                            {unifiedProductSchema.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.label} ({u.id})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

          {/* Schéma unifié */}
          <Card className="shadow-sm">
          <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Données unifiées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                {unifiedProductSchema.map((field) => (
                  <div key={field.id} className={`p-3 bg-card-hover rounded-lg border ${Object.values(mappings).includes(field.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-foreground">{field.label}</div>
                        {field.required && <div className="text-xs text-error">*</div>}
                    </div>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Étape Validation */}
      {step === 'validate' && (
      <Card>
        <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Aperçu (1–5 lignes)</CardTitle>
        </CardHeader>
        <CardContent>
            {previewRows.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">Aucun aperçu</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previewRows.map((row, idx) => (
                  <div key={idx} className="p-3 bg-card-hover rounded-lg border border-border">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Source</div>
                        <pre className="text-sm font-mono overflow-x-auto text-foreground">{JSON.stringify(row.src, null, 2)}</pre>
                      </div>
                  <div>
                        <div className="text-xs text-muted-foreground mt-1 mb-1">Unifié</div>
                        <pre className="text-sm font-mono overflow-x-auto text-foreground">{JSON.stringify(row.dst, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={()=>setStep('map')}>Retour au mapping</Button>
              <Button onClick={saveMapping} disabled={saving || Object.keys(mappings).length === 0} className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />Publier
              </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Étape Publication */}
      {step === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Mapping publié</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Votre mapping actif est prêt pour les ingestions et les recommandations.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}