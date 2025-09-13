import React from 'react';
import type { Brand, Product } from '../../types';
import { ProductCardContent } from './ProductCardContent';
import { GlowingCards, GlowingCard } from '../shared/GlowingCards';

interface BrandProductsPageProps {
    brand: Brand;
    allProducts: Product[];
    onProductClick: (product: Product) => void;
    onBack: () => void;
}

const BrandProductsPage: React.FC<BrandProductsPageProps> = ({ brand, allProducts, onProductClick, onBack }) => {
    const brandProducts = allProducts.filter(p => p.brandId === brand.id);
    const glowColors = ['#FF1B8D', '#00F2FF', '#ADFF00', '#FF5733', '#BF40BF', '#00BFFF'];
    
    return (
        <div className="bg-background py-12 min-h-[60vh]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
                    &larr; Back to all brands
                </button>
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 bg-card border border-border rounded-lg p-2 mb-4 flex items-center justify-center">
                        <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain"/>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{brand.name}</h1>
                </div>

                 {brandProducts.length > 0 ? (
                    <GlowingCards>
                        {brandProducts.map((product, index) => (
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
                    <div className="text-center py-16 bg-card rounded-lg border border-border">
                        <p className="text-xl text-muted-foreground">No products found for this brand.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandProductsPage;
