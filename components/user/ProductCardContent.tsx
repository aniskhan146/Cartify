import React from 'react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../shared/utils';
import { HeartIcon, ShoppingCartIcon, StarIcon } from '../shared/icons';
import { cn } from '../../lib/utils';

interface ProductCardContentProps {
  product: Product;
}

export const ProductCardContent: React.FC<ProductCardContentProps> = ({ product }) => {
    const { addToCart } = useCart();
    const { currentUser } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const firstAvailableVariant = product.variants?.find(v => v.stock > 0);
        if (!firstAvailableVariant) return;
        addToCart(product, firstAvailableVariant);
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return; // Or prompt to login
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };
    
    const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
    const hasStock = totalStock > 0;
    
    const displayVariant = product.variants?.[0];

    const discountPercent = displayVariant?.originalPrice
      ? Math.round(((displayVariant.originalPrice - displayVariant.price) / displayVariant.originalPrice) * 100)
      : 0;

    return (
        <div className="flex flex-col h-full">
            <div className="relative block aspect-square w-full overflow-hidden">
                <img
                    src={product.imageUrls?.[0] || ''}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                 {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">
                    -{discountPercent}%
                  </span>
                )}
                 {currentUser && (
                    <button
                        onClick={handleWishlistToggle}
                        className={cn(
                            "absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm transition-colors hover:bg-background/80",
                            isInWishlist(product.id) ? 'text-red-500' : 'text-foreground'
                        )}
                        aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <HeartIcon className="h-5 w-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                    </button>
                )}
                 {!hasStock && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                         <span className="text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-md">Out of Stock</span>
                     </div>
                 )}
            </div>

            <div className="p-3 flex flex-col flex-grow">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{product.category}</p>
                <h3 className="mb-2 block text-sm font-semibold text-foreground transition-colors group-hover:text-primary h-10 overflow-hidden">
                    {product.name}
                </h3>
                <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1.5">({product.reviews})</span>
                </div>
                
                <div className="mt-auto flex items-end justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-base font-bold text-foreground">{formatCurrency(displayVariant?.price ?? 0)}</span>
                        {displayVariant?.originalPrice && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">{formatCurrency(displayVariant.originalPrice)}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCartClick}
                        disabled={!hasStock}
                        className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground transition-transform transform active:scale-90 hover:scale-110 disabled:bg-muted disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Add to cart"
                    >
                        <ShoppingCartIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};