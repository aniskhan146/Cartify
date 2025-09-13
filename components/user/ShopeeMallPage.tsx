import React from 'react';
import type { Brand } from '../../types';
import BorderBeam from './BorderBeam';

interface ShopeeMallPageProps {
    brands: Brand[];
    onBrandClick: (brand: Brand) => void;
    onBack: () => void;
}

const ShopeeMallPage: React.FC<ShopeeMallPageProps> = ({ brands, onBrandClick, onBack }) => {
    return (
        <div className="bg-background py-12 min-h-[60vh]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="mb-8 text-sm font-medium text-muted-foreground hover:text-foreground">
                    &larr; Back to shop
                </button>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 text-center">Shopee Mall Brands</h1>
                
                {brands.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {brands.map((brand) => (
                            <button
                                key={brand.id}
                                onClick={() => onBrandClick(brand)}
                                className="relative group block bg-card border border-border rounded-lg h-full overflow-hidden shadow-sm hover:shadow-lg transition-all p-4 aspect-square flex items-center justify-center hover:-translate-y-1"
                            >
                                <img src={brand.logoUrl} alt={brand.name} loading="lazy" decoding="async" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"/>
                                <BorderBeam size={100} duration={5} delay={Math.random() * 8} />
                            </button>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 bg-card rounded-lg border border-border">
                        <p className="text-xl text-muted-foreground">No brands have been added yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopeeMallPage;