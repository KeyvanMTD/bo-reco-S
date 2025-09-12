import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Filter, X } from 'lucide-react';

const mockProducts = [
  {
    id: 'PRD_001',
    name: 'Wireless Bluetooth Headphones',
    brand: 'TechSound',
    price: 99.99,
    stock: 156,
    tags: ['Electronics', 'Audio', 'Wireless'],
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    image: 'https://picsum.photos/300/400?random=1',
    category: 'Electronics',
    sku: 'TS-WBH-001',
    metadata: {
      weight: '250g',
      color: 'Black',
      warranty: '2 years',
    },
  },
  {
    id: 'PRD_002',
    name: 'Organic Cotton T-Shirt',
    brand: 'EcoWear',
    price: 29.99,
    stock: 89,
    tags: ['Clothing', 'Organic', 'Sustainable'],
    description: 'Comfortable organic cotton t-shirt made from sustainable materials.',
    image: 'https://picsum.photos/300/400?random=2',
    category: 'Clothing',
    sku: 'EW-OCT-002',
    metadata: {
      material: '100% Organic Cotton',
      size: 'M',
      care: 'Machine wash cold',
    },
  },
  {
    id: 'PRD_003',
    name: 'Stainless Steel Water Bottle',
    brand: 'HydroLife',
    price: 24.99,
    stock: 234,
    tags: ['Kitchen', 'Eco-friendly', 'BPA-free'],
    description: 'Insulated stainless steel water bottle that keeps drinks cold for 24 hours.',
    image: 'https://picsum.photos/300/400?random=3',
    category: 'Home & Garden',
    sku: 'HL-SSWB-003',
    metadata: {
      capacity: '500ml',
      material: 'Stainless Steel',
      insulation: 'Double-wall vacuum',
    },
  },
  {
    id: 'PRD_004',
    name: 'Gaming Mechanical Keyboard',
    brand: 'GamePro',
    price: 149.99,
    stock: 45,
    tags: ['Gaming', 'Mechanical', 'RGB'],
    description: 'Professional gaming keyboard with cherry MX switches and RGB lighting.',
    image: 'https://picsum.photos/300/400?random=4',
    category: 'Electronics',
    sku: 'GP-GMK-004',
    metadata: {
      switches: 'Cherry MX Blue',
      lighting: 'RGB Backlit',
      connectivity: 'USB-C',
    },
  },
  {
    id: 'PRD_005',
    name: 'Yoga Mat Premium',
    brand: 'ZenFit',
    price: 39.99,
    stock: 122,
    tags: ['Fitness', 'Yoga', 'Non-slip'],
    description: 'High-quality yoga mat with superior grip and cushioning for all practice levels.',
    image: 'https://picsum.photos/300/400?random=5',
    category: 'Sports & Fitness',
    sku: 'ZF-YMP-005',
    metadata: {
      thickness: '6mm',
      material: 'TPE',
      dimensions: '183cm x 61cm',
    },
  },
];

export default function Catalog() {
  const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['All', 'Electronics', 'Clothing', 'Home & Garden', 'Sports & Fitness'];

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Catalog</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue produits
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
          Importer produits
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou marque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category || (category === 'All' && !selectedCategory) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Produits ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border hover:shadow-sm transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.brand} • {product.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-medium text-foreground">${product.price}</div>
                    <div className="text-sm text-muted-foreground">Stock: {product.stock}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
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
        </CardContent>
      </Card>

      {/* Product Detail Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-semibold text-foreground">
                  Détails du produit
                </SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-4"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-64 rounded-lg object-cover"
                />
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {selectedProduct.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Marque:</span>
                      <span className="ml-2 font-medium text-foreground">{selectedProduct.brand}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prix:</span>
                      <span className="ml-2 font-medium text-foreground">${selectedProduct.price}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stock:</span>
                      <span className="ml-2 font-medium text-foreground">{selectedProduct.stock}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU:</span>
                      <span className="ml-2 font-medium text-foreground">{selectedProduct.sku}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Métadonnées</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedProduct.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}