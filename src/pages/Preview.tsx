import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Star } from 'lucide-react';

const mockRecommendations = [
  {
    id: 'PRD_006',
    name: 'Premium Wireless Mouse',
    brand: 'TechPro',
    price: 79.99,
    score: 0.95,
    image: 'https://picsum.photos/300/400?random=6',
    tags: ['Electronics', 'Wireless', 'Gaming'],
  },
  {
    id: 'PRD_007',
    name: 'Ergonomic Desk Chair',
    brand: 'ComfortPlus',
    price: 299.99,
    score: 0.87,
    image: 'https://picsum.photos/300/400?random=7',
    tags: ['Furniture', 'Ergonomic', 'Office'],
  },
  {
    id: 'PRD_008',
    name: 'Smart Home Hub',
    brand: 'HomeConnect',
    price: 149.99,
    score: 0.82,
    image: 'https://picsum.photos/300/400?random=8',
    tags: ['Smart Home', 'IoT', 'Voice Control'],
  },
];

export default function Preview() {
  const [productId, setProductId] = useState('PRD_001');
  const [kind, setKind] = useState('similar');
  const [limit, setLimit] = useState('3');
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setRecommendations(mockRecommendations);
      setIsLoading(false);
    }, 1000);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-card-hover rounded-lg border border-border overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge 
                        variant="secondary" 
                        className={`${getScoreColor(product.score)} bg-background/90 backdrop-blur-sm`}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {(product.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                    <p className="text-lg font-bold text-foreground mb-3">${product.price}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {product.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{product.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
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
{JSON.stringify({
  productId,
  kind,
  limit: parseInt(limit),
  recommendations: recommendations.map(r => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    price: r.price,
    score: r.score,
  }))
}, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}