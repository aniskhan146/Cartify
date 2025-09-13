import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

const PRODUCTS_PER_PAGE = 12;

const AllProductsPage: React.FC<AllProductsPageProps> = ({ allProducts, categories, onProductClick, onBack, initialCategory }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const glowColors = ['#FF1B8D', '#00F2FF', '#ADFF00', '#FF5733', '#BF40BF', '#00BFFF'];
    const maxPrice = useMemo(() => Math.ceil(Math.max(...allProducts.flatMap(p => p.variants.map(v => v.price)), 0)), [allProducts]);

    const [filters, setFilters] = useState<Filters>({
        categories: initialCategory ? [initialCategory] : [],
        priceRange: [0, maxPrice],
        rating: 0,
        stockStatus: 'all',
    });
    
    const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<HTMLDivElement | null>(null);

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
                // FIX: Use product.category which is now the correct property for the category name
                product.category.toLowerCase().includes(lowercasedQuery);

            // FIX: Use product.category which is now the correct property for the category name
            const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);

            const matchesPrice = product.variants.some(v => v.price >= filters.priceRange[0] && v.price <= filters.priceRange[1]);
            
            const matchesRating = product.rating >= filters.rating;

            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            const matchesStock = filters.stockStatus === 'all' ||
                (filters.stockStatus === 'inStock' && totalStock > 0) ||
                (filters.stockStatus === 'outOfStock' && totalStock === 0);

            return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesStock;
        });
    }, [allProducts, searchQuery, filters]);

    useEffect(() => {
        setCurrentPage(1);
        setDisplayedProducts(filteredProducts.slice(0, PRODUCTS_PER_PAGE));
    }, [filteredProducts]);

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

    const loadMoreProducts = useCallback(() => {
        if (isLoadingMore) return;

        setIsLoadingMore(true);
        // Simulate network delay for smoother UX
        setTimeout(() => {
            const nextPage = currentPage + 1;
            const nextProducts = filteredProducts.slice(
                currentPage * PRODUCTS_PER_PAGE,
                nextPage * PRODUCTS_PER_PAGE
            );
            setDisplayedProducts(prev => [...prev, ...nextProducts]);
            setCurrentPage(nextPage);
            setIsLoadingMore(false);
        }, 500);
    }, [currentPage, filteredProducts, isLoadingMore]);

    const hasMoreProducts = displayedProducts.length < filteredProducts.length;

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreProducts && !isLoadingMore) {
            loadMoreProducts();
        }
    }, [hasMoreProducts, isLoadingMore, loadMoreProducts]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '0px',
            threshold: 1.0,
        });

        const currentObserverRef = observerRef.current;
        if (currentObserverRef) {
            observer.observe(currentObserverRef);
        }

        return () => {
            if (currentObserverRef) {
                observer.unobserve(currentObserverRef);
            }
        };
    }, [handleObserver]);

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
                        
                        {displayedProducts.length > 0 ? (
                             <GlowingCards padding="0">
                                {displayedProducts.map((product, index) => (
                                    <GlowingCard 
                                        key={product.id} 
                                        glowColor={glowColors[index % glowColors.length]}
                                        onClick={() => onProductClick(product)}
                                    >
                                       <ProductCardContent product={product} />
                                    </GlowingCard>
                                ))}
                            </GlowingCards>
                        ) : !isLoadingMore ? (
                            <div className="text-center py-16 bg-card rounded-lg border border-border min-h-96 flex flex-col justify-center items-center">
                                <p className="text-xl text-muted-foreground">No products found.</p>
                                <p className="text-md text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                            </div>
                        ) : null}

                        {hasMoreProducts && <div ref={observerRef} />}
                        
                        {isLoadingMore && (
                            <div className="flex justify-center items-center py-8">
                                <div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
                            </div>
                        )}

                        {!isLoadingMore && !hasMoreProducts && displayedProducts.length > 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>You've reached the end of the list.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AllProductsPage;