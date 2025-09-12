import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Category } from '../../types';
import FilterSidebar from './FilterSidebar';
import { ProductCardContent } from './ProductCardContent';
import { SearchIcon } from '../shared/icons';
import { GlowingCards, GlowingCard } from '../shared/GlowingCards';

export interface Filters {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  stockStatus: 'all' | 'inStock' | 'outOfStock';
}

interface AllProductsPageProps {
  allProducts: Product[];
  categories: Category[];
  onProductClick: (product: Product) => void;
  onBack: () => void;
  initialCategory?: string;
}

const AllProductsPage: React.FC<AllProductsPageProps> = ({ allProducts, categories, onProductClick, onBack, initialCategory }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const glowColors = ['#FF1B8D', '#00F2FF', '#ADFF00', '#FF5733', '#BF40BF', '#00BFFF'];

    // FIX: Property 'price' does not exist on type 'Product'. Calculate maxPrice from all variants of all products.
    const maxPrice = useMemo(() => Math.ceil(Math.max(...allProducts.flatMap(p => p.variants.map(v => v.price)), 0)), [allProducts]);

    const [filters, setFilters] = useState<Filters>({
        categories: initialCategory ? [initialCategory] : [],
        priceRange: [0, maxPrice],
        rating: 0,
        stockStatus: 'all',
    });
    
    useEffect(() => {
        if (maxPrice > 0) {
            setFilters(f => ({ ...f, priceRange: [0, maxPrice] }));
        }
    }, [maxPrice]);
    
    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            const lowercasedQuery = searchQuery.toLowerCase();
            const matchesSearch = lowercasedQuery === '' ||
                product.name.toLowerCase().includes(lowercasedQuery) ||
                product.category.toLowerCase().includes(lowercasedQuery);

            const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);

            // FIX: Property 'price' does not exist on type 'Product'. Check if any variant's price is within the range.
            const matchesPrice = product.variants.some(v => v.price >= filters.priceRange[0] && v.price <= filters.priceRange[1]);
            
            const matchesRating = product.rating >= filters.rating;

            // FIX: Property 'stock' does not exist on type 'Product'. Check total stock from all variants.
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            const matchesStock = filters.stockStatus === 'all' ||
                // FIX: Property 'stock' does not exist on type 'Product'. Check total stock from all variants.
                (filters.stockStatus === 'inStock' && totalStock > 0) ||
                // FIX: Property 'stock' does not exist on type 'Product'. Check total stock from all variants.
                (filters.stockStatus === 'outOfStock' && totalStock === 0);

            return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesStock;
        });
    }, [allProducts, searchQuery, filters]);

    const handleFilterChange = (newFilters: Partial<Filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };
    
    const handleClearFilters = () => {
        setFilters({
            categories: [],
            priceRange: [0, maxPrice],
            rating: 0,
            stockStatus: 'all'
        });
        setSearchQuery('');
    };

    return (
        <div className="bg-background py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="mb-6 text-sm font-medium text-muted-foreground hover:text-foreground">
                    &larr; Back to shop
                </button>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">All Products</h1>
                    <p className="text-muted-foreground mt-2">Find what you're looking for.</p>
                </div>

                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    <aside className="lg:block mb-8 lg:mb-0">
                        <FilterSidebar 
                            categories={categories}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                            maxPrice={maxPrice}
                        />
                    </aside>
                    <main className="lg:col-span-3">
                        <div className="mb-6">
                            <div className="relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name or category..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        
                        {filteredProducts.length > 0 ? (
                             <GlowingCards className="justify-center sm:justify-start" padding="0">
                                {filteredProducts.map((product, index) => (
                                    <GlowingCard 
                                        key={product.id} 
                                        glowColor={glowColors[index % glowColors.length]}
                                        onClick={() => onProductClick(product)}
                                    >
                                       <ProductCardContent product={product} />
                                    </GlowingCard>
                                ))}
                            </GlowingCards>
                        ) : (
                            <div className="text-center py-16 bg-card rounded-lg border border-border min-h-96 flex flex-col justify-center items-center">
                                <p className="text-xl text-muted-foreground">No products found.</p>
                                <p className="text-md text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                            </div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default AllProductsPage;
