import React, { useState, useEffect } from 'react';
import type { Product, Variant } from '../../types';
import { StarIcon, XIcon, HeartIcon } from '../shared/icons';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { formatCurrency } from '../shared/utils';
import AnimatedCartButton from '../shared/AnimatedCartButton';
import Toast from '../shared/Toast';
import { cn } from '../../lib/utils';


interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
  onNavigateToCheckout: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, onNavigateToCheckout }) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [mainImage, setMainImage] = useState(product.imageUrls[0]);

  useEffect(() => {
    const firstAvailableVariant = product.variants.find(v => v.stock > 0) || product.variants[0] || null;
    setSelectedVariant(firstAvailableVariant);
  }, [product]);

  useEffect(() => {
    // Update main image when variant changes, if it has a specific image
    if (selectedVariant?.imageUrl) {
      setMainImage(selectedVariant.imageUrl);
    } else {
      setMainImage(product.imageUrls[0]); // Fallback to first general image
    }
  }, [selectedVariant, product.imageUrls]);


  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;

  const [showToast, setShowToast] = useState(false);

  const handleAddToCart = () => {
    if (isOutOfStock || !selectedVariant) return;
    addToCart(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock || !selectedVariant) return;
    handleAddToCart();
    setShowToast(true);

    setTimeout(() => {
        onClose(); // Close modal first
        onNavigateToCheckout();
    }, 2000);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(q => Math.max(1, q - 1));
  };

  const increaseQuantity = () => {
    if (!selectedVariant) return;
    setQuantity(q => Math.min(selectedVariant.stock, q + 1));
  };

  const handleVariantSelect = (variant: Variant) => {
    setSelectedVariant(variant);
    setQuantity(1); // Reset quantity on variant change
  };

  return (
    <>
    <Toast 
        message="Redirecting to checkout..."
        show={showToast}
        onClose={() => setShowToast(false)}
        duration={2000}
    />
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] modal-backdrop" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl h-auto max-h-[90vh] flex flex-col md:flex-row relative border border-border modal-content" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-4 text-muted-foreground hover:text-foreground z-10">
            <XIcon className="h-6 w-6" />
        </button>
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 p-4 flex flex-col items-center justify-center">
            <div className="relative mb-2 w-full">
                <img 
                    src={mainImage} 
                    alt={product.name} 
                    className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                />
            </div>
            {product.imageUrls.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto p-1 mt-2">
                {product.imageUrls.map((url, index) => (
                  <button 
                    key={index}
                    onClick={() => setMainImage(url)}
                    className={`block w-14 h-14 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${mainImage === url ? 'border-primary' : 'border-border hover:border-muted-foreground'}`}
                  >
                    <img src={url} alt={`thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center overflow-y-auto">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground mb-1">{product.name}</h2>
            <p className="text-md text-muted-foreground mb-3">{product.category}</p>
            <div className="flex items-center mb-3">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className={`h-5 w-5 ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                </div>
                <span className="text-sm text-muted-foreground ml-2">{product.rating} ({product.reviews} reviews)</span>
            </div>
            <div className="mb-4">
              <span className="text-xl font-bold text-foreground">{formatCurrency(selectedVariant?.price ?? 0)}</span>
              {selectedVariant?.originalPrice && (
                <span className="text-md text-muted-foreground line-through ml-3">{formatCurrency(selectedVariant.originalPrice)}</span>
              )}
            </div>
            
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Select Variant:</h3>
                <div className="flex flex-wrap gap-2">
                    {product.variants.map(variant => (
                        <button key={variant.id} onClick={() => handleVariantSelect(variant)} disabled={variant.stock === 0} className={cn(
                            "px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all",
                            selectedVariant?.id === variant.id ? "border-primary bg-primary/10 text-primary-foreground" : "border-border bg-background hover:border-primary/50",
                            variant.stock === 0 && "opacity-50 cursor-not-allowed line-through"
                        )}>
                            {variant.name}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-muted-foreground mb-5 leading-relaxed text-sm max-h-28 overflow-y-auto">
              {product.description || 'No description available for this product.'}
            </p>
            
            {!isOutOfStock && (
                <div className="flex items-center space-x-4 mb-4">
                    <span className="text-sm font-medium text-foreground">Quantity:</span>
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="px-3 py-1 bg-muted rounded-l-md text-foreground disabled:opacity-50"
                            onClick={decreaseQuantity}
                            disabled={quantity <= 1}
                        >
                            -
                        </button>
                        <span
                            className="w-10 py-1 text-center font-semibold bg-background border-y border-border"
                        >
                            {quantity}
                        </span>
                        <button
                            type="button"
                            className="px-3 py-1 bg-muted rounded-r-md text-foreground disabled:opacity-50"
                            onClick={increaseQuantity}
                            disabled={!selectedVariant || quantity >= selectedVariant.stock}
                        >
                            +
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="flex flex-grow items-center space-x-2">
                {isOutOfStock ? (
                    <button disabled className="w-full h-8 bg-destructive text-destructive-foreground rounded-lg font-semibold cursor-not-allowed text-xs">
                        Out of Stock
                    </button>
                ) : (
                    <>
                        <AnimatedCartButton
                            onAddToCart={(e) => { e.stopPropagation(); handleAddToCart(); }}
                            className="flex-1 font-semibold"
                        />
                        <AnimatedCartButton
                            onAddToCart={handleBuyNow}
                            text="Buy Now"
                            className="flex-1 bg-secondary text-secondary-foreground hover:bg-accent"
                        />
                    </>
                )}
              </div>
               {currentUser && (
                    <button
                        onClick={handleWishlistToggle}
                        className="p-2 border-2 border-border rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                        aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <HeartIcon className={`h-5 w-5 ${isInWishlist(product.id) ? 'text-red-500' : ''}`} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                    </button>
                )}
            </div>
             <p className={`text-sm font-semibold mt-3 ${isOutOfStock ? 'text-destructive' : 'text-green-600'}`}>
                {isOutOfStock ? 'Currently unavailable' : `${selectedVariant?.stock} in stock`}
              </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default QuickViewModal;