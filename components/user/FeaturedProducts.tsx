import React from 'react';
import { ProductCardContent } from './ProductCardContent';
import type { Product } from '../../types';
import { GlowingCards, GlowingCard } from '../shared/GlowingCards';

interface FeaturedProductsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const glowColors = [
  '#FF1B8D',
  '#00F2FF',
  '#ADFF00',
  '#FF5733',
  '#BF40BF',
  '#00BFFF',
];

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onProductClick }) => {
  return (
    <div className="bg-background py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          Featured Products
        </h2>
        {products.length > 0 ? (
          <GlowingCards>
            {products.map((product, index) => (
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
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found.</p>
            <p className="text-md text-muted-foreground mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;
