import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid3X3, List, SlidersHorizontal, Heart, Share2, ShoppingCart, Eye, Filter, X, ChevronDown, Star } from 'lucide-react';
import { Api, DEFAULT_TENANT } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRecommendations, type RecoResponse } from '@/lib/recoClient';
import Hero from '@/components/Hero';
import ProductDetails from '@/components/ProductDetails';

type Product = {
  tenant?: string;
  product_id: string;
  title?: string;
  brand?: string;
  price?: number;
  currency?: string;
  in_stock?: boolean;
  category_path?: string[];
  image?: string | null;
  updated_at?: string;
  attributes?: Record<string, unknown>;
};

type ViewMode = 'grid' | 'list' | 'large';
type SortBy = 'name' | 'price_asc' | 'price_desc' | 'updated' | 'brand';

interface FilterState {
  categories: string[];
  brands: string[];
  priceRange: [number, number] | null;
  inStockOnly: boolean;
}

export default function Catalog() {
  // Core states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRecoTab, setActiveRecoTab] = useState<'similar' | 'complementary' | 'x-sell'>('similar');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit] = useState(50);
  
  // New Premium states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    priceRange: null,
    inStockOnly: false,
  });

  const tenant = DEFAULT_TENANT || 'la_redoute';
  const { data, isLoading } = useQuery({
    queryKey: ['products', tenant, searchTerm, limit],
    queryFn: async () => {
      const base = await Api.products({ tenant, q: searchTerm, limit });
      const rawItems: any[] = base?.items ?? [];
      // Si rien, retourne tôt
      if (!rawItems.length) return { items: [] } as any;
      // Lookup par lots de 50 pour éviter un body trop gros
      const ids = rawItems.map((p: any) => p.product_id).filter(Boolean);
      const chunkSize = 50;
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
      const enrichedAll: any[] = [];
      for (const c of chunks) {
        try {
          const part = await Api.productsLookup({ tenant, ids: c });
          enrichedAll.push(...(Array.isArray(part) ? part : []));
        } catch {
          // si le webhook n'est pas dispo, on continue sans enrichissement
        }
      }
      const byId = new Map<string, any>();
      enrichedAll.forEach((p) => {
        const pid = p?.product_id || p?.id || p?._id;
        if (pid) byId.set(String(pid), p);
      });
      const merged = rawItems.map((p) => ({ ...p, ...(byId.get(p.product_id) || {}) }));
      return { items: merged } as any;
    },
  });
  const rawItems: Product[] = (data as any)?.items ?? [];

  // Filter and sort logic
  const filteredAndSortedItems = useMemo(() => {
    let filtered = rawItems.filter(product => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const name = product.title || (product as any).name || '';
        const brand = product.brand || (product as any).brand || '';
        if (!name.toLowerCase().includes(searchLower) && !brand.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Stock filter
      if (filters.inStockOnly && !product.in_stock) return false;

      // Brand filter
      if (filters.brands.length > 0) {
        const productBrand = product.brand || (product as any).brand || '';
        if (!filters.brands.includes(productBrand)) return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const price = product.price ?? (product as any).current_price;
        if (price !== undefined && (price < filters.priceRange[0] || price > filters.priceRange[1])) {
          return false;
        }
      }

      return true;
    });

    // Sort logic
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.title || (a as any).name || a.product_id;
          const nameB = b.title || (b as any).name || b.product_id;
          return nameA.localeCompare(nameB);
        case 'price_asc':
          const priceA = a.price ?? (a as any).current_price ?? 0;
          const priceB = b.price ?? (b as any).current_price ?? 0;
          return priceA - priceB;
        case 'price_desc':
          const priceA2 = a.price ?? (a as any).current_price ?? 0;
          const priceB2 = b.price ?? (b as any).current_price ?? 0;
          return priceB2 - priceA2;
        case 'brand':
          const brandA = a.brand || (a as any).brand || '';
          const brandB = b.brand || (b as any).brand || '';
          return brandA.localeCompare(brandB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [rawItems, searchTerm, filters, sortBy]);

  // Extract unique values for filters
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    rawItems.forEach(item => {
      const brand = item.brand || (item as any).brand;
      if (brand) brands.add(brand);
    });
    return Array.from(brands).sort();
  }, [rawItems]);

  return (
    <div className="space-y-8">
      <Hero
        variant="catalog"
        title="Catalogue"
        subtitle="Explorez votre collection de produits avec une expérience moderne et intuitive."
        actions={[
          { label: 'Importer des produits', variant: 'default' }, 
          { label: 'Voir les mappings', variant: 'outline', href: '/mappings' }
        ]}
      />

      {/* Premium Search & Filters Header */}
      <div className="card-premium p-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Bar Premium */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un produit, une marque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium pl-12 h-12 text-body-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Filters & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-44 h-12 border-premium">
                <SelectValue placeholder="Trier par..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="price_asc">Prix croissant</SelectItem>
                <SelectItem value="price_desc">Prix décroissant</SelectItem>
                <SelectItem value="brand">Marque</SelectItem>
                <SelectItem value="updated">Récent</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters Button */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-premium px-4 h-12 ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {(filters.brands.length > 0 || filters.inStockOnly) && (
                <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                  {filters.brands.length + (filters.inStockOnly ? 1 : 0)}
                </Badge>
              )}
            </button>

            {/* View Mode Toggle */}
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

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-border animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Brand Filter */}
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Marques
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableBrands.slice(0, 8).map(brand => (
                    <button
                      key={brand}
                      onClick={() => {
                        const newBrands = filters.brands.includes(brand)
                          ? filters.brands.filter(b => b !== brand)
                          : [...filters.brands, brand];
                        setFilters(prev => ({ ...prev, brands: newBrands }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-body-sm transition-premium border ${
                        filters.brands.includes(brand)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-secondary text-muted-foreground border-border hover:border-border-hover'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Disponibilité
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-body-sm text-foreground">Seulement en stock</span>
                </label>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ categories: [], brands: [], priceRange: null, inStockOnly: false })}
                  className="btn-premium btn-secondary h-9 px-4"
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Counter */}
        <div className="mt-4 flex items-center justify-between text-body-sm text-muted-foreground">
          <span>
            {isLoading ? 'Chargement...' : `${filteredAndSortedItems.length} produit${filteredAndSortedItems.length !== 1 ? 's' : ''} trouvé${filteredAndSortedItems.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Premium Products Grid */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {isLoading ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-premium p-0 animate-pulse">
                {viewMode !== 'list' && (
                  <div className="h-48 bg-muted rounded-t-xl" />
                )}
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-h2 font-display text-foreground mb-2">Aucun produit trouvé</h3>
            <p className="text-body text-muted-foreground mb-6">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ categories: [], brands: [], priceRange: null, inStockOnly: false });
              }}
              className="btn-premium btn-primary"
            >
              Effacer tous les filtres
            </button>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
            viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredAndSortedItems.map((product, index) => (
              <ProductCard 
                key={product.product_id} 
                product={product} 
                viewMode={viewMode}
                index={index}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Premium Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0 border-premium shadow-premium-xl">
          <div className="h-full overflow-y-auto">
          {selectedProduct && (
            <PremiumProductModal 
              product={selectedProduct} 
              tenant={tenant} 
              activeRecoTab={activeRecoTab}
              setActiveRecoTab={setActiveRecoTab}
            />
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type RecoKind = 'similar' | 'complementary' | 'x-sell';

function RecoBlock({ tenant, productId, kind }: { tenant: string; productId: string; kind: RecoKind }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reco', tenant, productId, kind, 6],
    queryFn: async () => {
      const base: RecoResponse = await getRecommendations({ productId, kind, limit: 6, tenant });
      const items = Array.isArray(base.items) ? base.items : [];
      const ids = items.map((i) => i.product_id);
      let enriched: any[] = [];
      try {
        if (ids.length) enriched = await Api.productsLookup({ tenant, ids });
      } catch {}
      const byId = new Map<string, any>();
      enriched.forEach((p) => {
        const pid = p?.product_id || p?.id || p?._id;
        if (pid) byId.set(String(pid), p);
      });
      return items.map((i) => ({
        id: i.product_id,
        score: i.score,
        name: byId.get(i.product_id)?.name,
        image_url: byId.get(i.product_id)?.image_url || byId.get(i.product_id)?.image,
        price: byId.get(i.product_id)?.current_price ?? byId.get(i.product_id)?.price,
        currency: byId.get(i.product_id)?.currency,
        brand: byId.get(i.product_id)?.brand,
      }));
    },
    staleTime: 120000,
  });
  const items: Array<{ id: string; score?: number; name?: string; image_url?: string; price?: number; currency?: string; brand?: string }> = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-3 rounded border border-border bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return <div className="text-sm text-muted-foreground mt-2">Aucune recommandation</div>;
  }
  return (
    <div className="mt-3 space-y-2">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between p-3 rounded border border-border">
          <div className="flex items-center gap-3">
            {it.image_url ? (
              <img src={it.image_url} alt={it.name || it.id} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted" />
            )}
            <div>
              <div className="text-sm font-medium text-foreground">{it.name || it.id}</div>
              <div className="text-xs text-muted-foreground">{it.brand || '—'}</div>
            </div>
          </div>
          <div className="text-sm text-foreground">
            {it.price !== undefined ? `${it.price} ${it.currency || ''}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

// Premium Product Card Component
interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  index: number;
  onClick: () => void;
}

function ProductCard({ product, viewMode, index, onClick }: ProductCardProps) {
  const imageUrl = product.image || (product as any).image_url;
  const displayName = product.title || (product as any).name || product.product_id;
  const price = product.price ?? (product as any).current_price;
  const currency = product.currency ?? (product as any).currency ?? '€';
  const brand = product.brand || (product as any).brand;
  const categoriesRaw = (product as any).category_path ?? [];
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : typeof categoriesRaw === 'string'
      ? categoriesRaw.split('/').filter(Boolean)
      : [];

  if (viewMode === 'list') {
    return (
      <div 
        className="card-premium p-0 cursor-pointer group animate-fade-in interactive-scale"
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={onClick}
      >
        <div className="flex items-center p-6 gap-6">
          <div className="relative overflow-hidden rounded-xl shrink-0">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={displayName} 
                className="w-20 h-20 object-cover transition-premium group-hover:scale-110" 
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-secondary flex items-center justify-center rounded-xl">
                <div className="w-8 h-8 bg-muted rounded" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-h3 font-medium text-foreground mb-1 truncate group-hover:text-primary transition-fast">
              {displayName}
            </h3>
            <p className="text-body-sm text-muted-foreground mb-2">
              {brand || 'Marque inconnue'} • {product.product_id}
            </p>
            <div className="flex items-center gap-3">
              {price && (
                <span className="text-h3 font-semibold text-foreground">
                  {price.toLocaleString('fr-FR')} {currency}
                </span>
              )}
              <div className={`status-dot ${product.in_stock ? 'status-success' : 'status-error'}`} />
              <span className="text-caption text-muted-foreground">
                {product.in_stock ? 'En stock' : 'Rupture'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {categories.slice(0, 2).map((cat: string) => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-premium flex gap-2 shrink-0">
            <button className="w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-border flex items-center justify-center transition-premium">
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-border flex items-center justify-center transition-premium">
              <Heart className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card-premium p-0 cursor-pointer group animate-fade-in interactive-scale"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-gradient-secondary">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={displayName} 
            className="w-full h-full object-cover transition-premium group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-muted rounded-xl" />
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-premium">
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-lg bg-surface-primary/90 backdrop-blur border border-border/50 flex items-center justify-center transition-premium hover:scale-110">
                <Heart className="w-4 h-4 text-foreground" />
              </button>
              <button className="w-10 h-10 rounded-lg bg-surface-primary/90 backdrop-blur border border-border/50 flex items-center justify-center transition-premium hover:scale-110">
                <Share2 className="w-4 h-4 text-foreground" />
              </button>
            </div>
            
            {/* Stock Status */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur ${
              product.in_stock 
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-error/20 text-error border border-error/30'
            }`}>
              {product.in_stock ? 'En stock' : 'Rupture'}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="flex flex-wrap gap-1 mb-3">
          {categories.slice(0, 1).map((cat: string) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>

        <h3 className="text-body font-medium text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-fast">
          {displayName}
        </h3>
        
        <p className="text-body-sm text-muted-foreground mb-4">
          {brand || 'Marque inconnue'}
        </p>

        <div className="flex items-center justify-between">
          {price ? (
            <div className="flex flex-col">
              <span className="text-h3 font-semibold text-foreground">
                {price.toLocaleString('fr-FR')} {currency}
              </span>
            </div>
          ) : (
            <span className="text-body-sm text-muted-foreground">Prix non disponible</span>
          )}
          
          <button className="btn-premium btn-secondary px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition-premium">
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
}

// Premium Product Modal Component
interface PremiumProductModalProps {
  product: Product;
  tenant: string;
  activeRecoTab: 'similar' | 'complementary' | 'x-sell';
  setActiveRecoTab: (tab: 'similar' | 'complementary' | 'x-sell') => void;
}

function PremiumProductModal({ product, tenant, activeRecoTab, setActiveRecoTab }: PremiumProductModalProps) {
  const imageUrl = product.image || (product as any).image_url;
  const displayName = product.title || (product as any).name || product.product_id;
  const price = product.price ?? (product as any).current_price;
  const currency = product.currency ?? (product as any).currency ?? '€';
  const brand = product.brand || (product as any).brand;
  const description = (product as any).description || '';
  const categoriesRaw = (product as any).category_path ?? [];
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : typeof categoriesRaw === 'string'
      ? categoriesRaw.split('/').filter(Boolean)
      : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
      {/* Left Side - Image Gallery */}
      <div className="relative bg-gradient-secondary">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={displayName} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-muted rounded-2xl" />
          </div>
        )}
        
        {/* Floating Back Button */}
        <div className="absolute top-6 left-6">
          <button className="w-12 h-12 rounded-xl bg-surface-primary/90 backdrop-blur border border-border/50 flex items-center justify-center transition-premium hover:scale-110">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Right Side - Product Info */}
      <div className="p-8 overflow-y-auto">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat: string) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
            
            <h1 className="text-display-sm font-display text-foreground mb-2">
              {displayName}
            </h1>
            
            <p className="text-body-lg text-muted-foreground mb-4">
              {brand || 'Marque inconnue'}
            </p>

            {description && (
              <p className="text-body text-muted-foreground mb-6">
                {description}
              </p>
            )}

            <div className="flex items-center gap-6">
              {price && (
                <div className="text-display-sm font-display text-foreground">
                  {price.toLocaleString('fr-FR')} {currency}
                </div>
              )}
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                product.in_stock 
                  ? 'bg-success-light text-success'
                  : 'bg-error-light text-error'
              }`}>
                <div className={`status-dot ${product.in_stock ? 'status-success' : 'status-error'}`} />
                <span className="text-body-sm font-medium">
                  {product.in_stock ? 'En stock' : 'Stock épuisé'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              to={`/preview?product_id=${encodeURIComponent(product.product_id)}&kind=similar&limit=6&auto=1`}
              className="btn-premium btn-primary flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              Tester les recommandations
            </Link>
            
            <button className="btn-premium btn-secondary px-4">
              <Heart className="w-4 h-4" />
            </button>
            
            <button className="btn-premium btn-secondary px-4">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-2 gap-6 py-6 border-t border-border">
            <div>
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">ID Produit</span>
              <p className="text-body font-medium text-foreground mt-1">{product.product_id}</p>
            </div>
            
            <div>
              <span className="text-caption font-semibold text-muted-foreground uppercase tracking-wider">Dernière MAJ</span>
              <p className="text-body font-medium text-foreground mt-1">
                {product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR') : '—'}
              </p>
            </div>
          </div>

          {/* AI Attributes */}
          <div>
            <ProductDetails productId={product.product_id} tenant={tenant} />
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-h2 font-display text-foreground mb-4">Recommandations</h3>
            <Tabs value={activeRecoTab} onValueChange={(v) => setActiveRecoTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="similar">Similaires</TabsTrigger>
                <TabsTrigger value="complementary">Complémentaires</TabsTrigger>
                <TabsTrigger value="x-sell">Cross-sell</TabsTrigger>
              </TabsList>
              <TabsContent value="similar">
                <RecoBlock tenant={tenant} productId={product.product_id} kind="similar" />
              </TabsContent>
              <TabsContent value="complementary">
                <RecoBlock tenant={tenant} productId={product.product_id} kind="complementary" />
              </TabsContent>
              <TabsContent value="x-sell">
                <RecoBlock tenant={tenant} productId={product.product_id} kind="x-sell" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}