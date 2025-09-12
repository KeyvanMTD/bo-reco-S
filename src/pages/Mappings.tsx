import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowRight, Save, RotateCcw } from 'lucide-react';

const clientFields = [
  { id: 'product_id', label: 'product_id', type: 'string' },
  { id: 'title', label: 'title', type: 'string' },
  { id: 'brand_name', label: 'brand_name', type: 'string' },
  { id: 'price_amount', label: 'price_amount', type: 'number' },
  { id: 'inventory_count', label: 'inventory_count', type: 'number' },
  { id: 'category_name', label: 'category_name', type: 'string' },
  { id: 'product_description', label: 'product_description', type: 'text' },
  { id: 'image_url', label: 'image_url', type: 'url' },
];

const unifiedFields = [
  { id: 'id', label: 'ID', type: 'string', required: true },
  { id: 'name', label: 'Name', type: 'string', required: true },
  { id: 'brand', label: 'Brand', type: 'string', required: false },
  { id: 'price', label: 'Price', type: 'number', required: true },
  { id: 'stock', label: 'Stock', type: 'number', required: false },
  { id: 'category', label: 'Category', type: 'string', required: false },
  { id: 'description', label: 'Description', type: 'text', required: false },
  { id: 'image', label: 'Image URL', type: 'url', required: false },
];

const mappingVersions = [
  {
    id: 'v1.2.1',
    status: 'success' as const,
    label: 'Active',
    date: '2024-01-15 14:30',
    fields: 8,
  },
  {
    id: 'v1.2.0',
    status: 'pending' as const,
    label: 'Draft',
    date: '2024-01-14 16:20',
    fields: 7,
  },
  {
    id: 'v1.1.5',
    status: 'warning' as const,
    label: 'Deprecated',
    date: '2024-01-10 09:15',
    fields: 6,
  },
];

export default function Mappings() {
  const [mappings, setMappings] = useState<Record<string, string>>({
    product_id: 'id',
    title: 'name',
    brand_name: 'brand',
    price_amount: 'price',
    inventory_count: 'stock',
    category_name: 'category',
    product_description: 'description',
    image_url: 'image',
  });

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
        {/* Client Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Données client
            </CardTitle>
          </CardHeader>
          <CardContent>
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

        {/* Unified Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Données unifiées
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Mapping Versions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Historique des versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mappingVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <StatusBadge status={version.status} size="md">
                    {version.label}
                  </StatusBadge>
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
        </CardContent>
      </Card>
    </div>
  );
}