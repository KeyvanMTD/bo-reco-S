import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

type Recommendation = { product_id: string; score: number };

export default function Preview() {
  const [productId, setProductId] = useState('');
  const [kind, setKind] = useState('similar');
  const [limit, setLimit] = useState('3');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const res = await Api.recommendationsPreview({
        tenant: DEFAULT_TENANT,
        product_id: productId,
        kind,
        limit: parseInt(limit),
      });
      setRecommendations(res.items);
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

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'similar':
        return 'Produits similaires';
      case 'cross-sell':
        return 'Vente croisée';
      case 'upsell':
        return 'Montée en gamme';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Preview</h1>
        <p className="text-muted-foreground mt-1">
          Testez vos recommandations en temps réel
        </p>
      </div>

      {/* Preview Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Paramètres de recommandation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId" className="text-sm font-medium text-foreground">
                Product ID
              </Label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="PRD_001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kind" className="text-sm font-medium text-foreground">
                Type de recommandation
              </Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="similar">Produits similaires</SelectItem>
                  <SelectItem value="cross-sell">Vente croisée</SelectItem>
                  <SelectItem value="upsell">Montée en gamme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit" className="text-sm font-medium text-foreground">
                Nombre de résultats
              </Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 résultats</SelectItem>
                  <SelectItem value="6">6 résultats</SelectItem>
                  <SelectItem value="9">9 résultats</SelectItem>
                  <SelectItem value="12">12 résultats</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handlePreview} 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                {isLoading ? (
                  'Chargement...'
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Prévisualiser
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Résultats - {getKindLabel(kind)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-2">
              {recommendations.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border">
                  <div className="font-medium text-foreground">{item.product_id}</div>
                  <Badge variant="secondary" className={`font-mono ${getScoreColor(item.score)}`}>
                    {(item.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucune recommandation
              </h3>
              <p className="text-muted-foreground">
                Lancez une prévisualisation pour voir les résultats
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Preview */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Aperçu API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              <pre className="text-foreground overflow-x-auto">
{JSON.stringify({ productId, kind, limit: parseInt(limit), items: recommendations }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}