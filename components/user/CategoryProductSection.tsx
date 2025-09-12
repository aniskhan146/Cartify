import React, { useRef } from 'react';
import type { Product, Category } from '../../types';
import ProductCard from './ProductCard';
import { ChevronLeftIcon, ChevronRightIcon } from '../shared/icons';

interface CategoryProductSectionProps {
  category: Category;
  products: Product[];
  onProductClick: (product: Product) => void;
  onViewAllClick: (categoryName: string) => void;
}

const CategoryProductSection: React.FC<CategoryProductSectionProps> = ({ category, products, onProductClick, onViewAllClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) {
    return null;
  }
  
  const scroll = (scrollOffset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };
  
  return (
    <div 
        id={`category-${category.id.toLowerCase().replace(/ /g, '-')}`} 
        className="relative group" // For arrow visibility on hover
    >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">{category.name}</h2>
          <button onClick={() => onViewAllClick(category.name)} className="text-sm font-medium text-primary hover:underline">
            View All
          </button>
        </div>
        
        <div className="relative">
            {/* This is the scroll container */}
            <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-4">
                <div className="flex gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="snap-start w-64 flex-shrink-0">
                           <div className="bg-card border border-border rounded-lg h-full overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                                <ProductCard
                                    product={product}
                                    onClick={() => onProductClick(product)}
                                />
                           </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Arrows - only show if there's something to scroll to */}
            {products.length > 4 && (
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
  );
};

export default CategoryProductSection;
