import React, { useState, useEffect, useRef } from 'react';
import type { Brand } from '../../types';
import { onBrandsChange } from '../../services/databaseService';
import { ChevronLeftIcon, ChevronRightIcon } from '../shared/icons';

interface ShopeeMallProps {
    onViewAllClick: () => void;
    onBrandClick: (brand: Brand) => void;
}

const ShopeeMall: React.FC<ShopeeMallProps> = ({ onViewAllClick, onBrandClick }) => {
    const [featuredBrands, setFeaturedBrands] = useState<Brand[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onBrandsChange((brands) => {
            setFeaturedBrands(brands.filter(b => b.isFeatured));
        });
        return () => unsubscribe();
    }, []);
    
    const scroll = (scrollOffset: number) => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
        }
    };

    if (featuredBrands.length === 0) {
        return null;
    }

    return (
        <div className="bg-secondary py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Shopee Mall</h2>
                    <button onClick={onViewAllClick} className="text-sm font-medium text-primary hover:underline">View All</button>
                </div>
                
                <div className="relative group">
                     <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4">
                        <div className="flex gap-4">
                            {featuredBrands.map((brand) => (
                                <div key={brand.id} className="snap-start w-40 flex-shrink-0">
                                    <button onClick={() => onBrandClick(brand)} className="block bg-card border border-border rounded-lg h-full overflow-hidden shadow-sm hover:shadow-lg transition-shadow p-4 aspect-[4/3] flex items-center justify-center w-full">
                                        <img src={brand.logoUrl} alt={brand.name} className="max-w-full max-h-full object-contain"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {featuredBrands.length > 6 && (
                        <>
                            <button 
                              onClick={() => scroll(-300)}
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80 disabled:opacity-0 hidden md:block"
                              aria-label="Scroll left"
                            >
                              <ChevronLeftIcon className="h-6 w-6 text-foreground" />
                            </button>
                            <button 
                              onClick={() => scroll(300)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/50 backdrop-blur-sm p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background/80 disabled:opacity-0 hidden md:block"
                              aria-label="Scroll right"
                            >
                              <ChevronRightIcon className="h-6 w-6 text-foreground" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopeeMall;