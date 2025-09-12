import React from 'react';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductCardContent } from './ProductCardContent';
import type { Product } from '../../types';
import { HeartIcon } from '../shared/icons';
import BorderBeam from './BorderBeam';
import { GlowingCards, GlowingCard } from '../shared/GlowingCards';

interface WishlistPageProps {
  onBackToShop: () => void;
  onProductClick: (product: Product) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ onBackToShop, onProductClick }) => {
  const { wishlistItems } = useWishlist();
  const glowColors = ['#FF1B8D', '#00F2FF', '#ADFF00', '#FF5733', '#BF40BF', '#00BFFF'];

  return (
    <div className="bg-background py-12 min-h-[60vh]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8 text-center">My Wishlist</h1>
        
        {wishlistItems.length > 0 ? (
          <GlowingCards className="justify-center">
            {wishlistItems.map((product, index) => (
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
          <div className="relative text-center bg-card border border-border p-8 rounded-lg shadow-sm max-w-lg mx-auto overflow-hidden">
            <HeartIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty.</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything yet. Start exploring and save your favorites!
            </p>
            <button 
              onClick={onBackToShop} 
              className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </button>
            <BorderBeam size={200} duration={6} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
