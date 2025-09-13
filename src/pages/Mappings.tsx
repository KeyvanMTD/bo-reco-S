import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Save, RotateCcw } from 'lucide-react';

const clientFields: Array<{ id: string; label: string; type: string }> = [];

const unifiedFields: Array<{ id: string; label: string; type: string; required?: boolean }> = [];

const mappingVersions: Array<{
  id: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  label: string;
  date: string;
  fields: number;
}> = [];

export default function Mappings() {
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const [draggedField, setDraggedField] = useState<string | null>(null);

  const handleDragStart = (fieldId: string) => {
    setDraggedField(fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (draggedField) {
      setMappings(prev => ({
        ...prev,
        [draggedField]: targetFieldId,
      }));
      setDraggedField(null);
    }
  };

  const resetMappings = () => {
    setMappings({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Mappings</h1>
          <p className="text-muted-foreground mt-1">
            Configurez la correspondance entre vos données et le schéma unifié
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetMappings}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Valider le mapping
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Fields */
        }
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Données client
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientFields.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Aucun champ client disponible
              </div>
            ) : (
              <div className="space-y-2">
                {clientFields.map((field) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field.id)}
                    className="p-3 bg-card-hover rounded-lg border border-border cursor-move hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">{field.label}</div>
                      <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {field.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapping Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Correspondances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(mappings).map(([clientField, unifiedField]) => (
                <div key={clientField} className="flex items-center space-x-4">
                  <div className="flex-1 text-sm font-medium text-foreground">
                    {clientField}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 text-sm font-medium text-foreground">
                    {unifiedField}
                  </div>
                </div>
              ))}
              {Object.keys(mappings).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Glissez-déposez les champs pour créer les correspondances
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unified Fields */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Données unifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unifiedFields.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Aucun schéma unifié disponible
              </div>
            ) : (
              <div className="space-y-2">
                {unifiedFields.map((field) => (
                  <div
                    key={field.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, field.id)}
                    className={`p-3 bg-card-hover rounded-lg border border-border transition-all duration-200 ${
                      Object.values(mappings).includes(field.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-foreground">{field.label}</div>
                        {field.required && (
                          <div className="text-xs text-error">*</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        {field.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mapping Versions */
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Historique des versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mappingVersions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Aucune version disponible
            </div>
          ) : (
            <div className="space-y-3">
              {mappingVersions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">
                      {version.label}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{version.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {version.fields} champs mappés • {version.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Voir
                    </Button>
                    {version.status === 'pending' && (
                      <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                        Activer
                      </Button>
                    )}
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