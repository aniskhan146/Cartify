import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { getRecentlyViewedProductIds } from '../../services/recentlyViewedService';
import ProductCard from './ProductCard';

interface RecentlyViewedSectionProps {
  allProducts: Product[];
  onProductClick: (product: Product) => void;
}

const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({ allProducts, onProductClick }) => {
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const viewedIds = getRecentlyViewedProductIds();
    if (viewedIds.length > 0 && allProducts.length > 0) {
      // Create a map for quick lookups
      const productsMap = new Map(allProducts.map(p => [p.id, p]));
      
      // Filter and map the products based on the viewed IDs, preserving order
      const products = viewedIds
        .map(id => productsMap.get(id))
        .filter((p): p is Product => p !== undefined);
        
      setRecentlyViewedProducts(products);
    }
  }, [allProducts]);

  if (recentlyViewedProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-secondary py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          Recently Viewed
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentlyViewedProducts.map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard
                product={product}
                onClick={() => onProductClick(product)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentlyViewedSection;
