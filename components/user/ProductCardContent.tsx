import React from 'react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../shared/utils';
import AnimatedCartButton from '../shared/AnimatedCartButton';

interface ProductCardContentProps {
  product: Product;
}

export const ProductCardContent: React.FC<ProductCardContentProps> = ({ product }) => {
    const { addToCart } = useCart();
    const { currentUser } = useAuth();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const firstAvailableVariant = product.variants.find(v => v.stock > 0);
        if (!firstAvailableVariant) return;
        addToCart(product, firstAvailableVariant);
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    };
    
    const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
    const hasStock = totalStock > 0;
    
    const getPriceDisplay = () => {
        if (!product.variants || product.variants.length === 0) return formatCurrency(0);
        const prices = product.variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
            return formatCurrency(minPrice);
        }
        return `From ${formatCurrency(minPrice)}`;
    };

    const getOriginalPriceDisplay = () => {
        if (!product.variants || product.variants.length === 0) return null;
        const firstVariantWithOriginalPrice = product.variants.find(v => v.originalPrice);
        if (firstVariantWithOriginalPrice) {
            return firstVariantWithOriginalPrice.originalPrice;
        }
        return null;
    };

    const originalPrice = getOriginalPriceDisplay();
    const displayPrice = getPriceDisplay();
    const lowestPrice = parseFloat(displayPrice.replace(/[^0-9.-]+/g,""));
    
    const discountPercent = originalPrice 
      ? Math.round(((originalPrice - lowestPrice) / originalPrice) * 100)
      : 0;
      
    return (
        <>
            <div className="relative block aspect-square w-full overflow-hidden">
                <img
                    src={product.imageUrls[0]}
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                 {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    -{discountPercent}%
                  </span>
                )}
                 {currentUser && (
                    <button
                        onClick={handleWishlistToggle}
                        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/60 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <svg className={`h-5 w-5 ${isInWishlist(product.id) ? 'text-red-500' : 'text-foreground'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="p-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{product.category}</p>
                <h3 className="mb-2 block text-sm font-semibold text-foreground transition-colors group-hover:text-primary h-10 overflow-hidden">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">{displayPrice}</span>
                    {originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full translate-y-full transform bg-card p-4 pt-0 transition-transform duration-300 group-hover:translate-y-0">
                 {hasStock ? (
                    <AnimatedCartButton
                        onAddToCart={handleAddToCartClick}
                        className="font-semibold"
                    />
                ) : (
                    <button
                        disabled
                        className="w-full h-8 rounded-lg font-semibold text-xs bg-destructive text-destructive-foreground cursor-not-allowed"
                    >
                        Out of Stock
                    </button>
                )}
            </div>
        </>
    );
};