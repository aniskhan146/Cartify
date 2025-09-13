import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../shared/utils';
import AnimatedCartButton from '../shared/AnimatedCartButton';
import Toast from '../shared/Toast';
import { cn } from '../../lib/utils';
import { TruckIcon } from '../shared/icons';
import { addProductToRecentlyViewed } from '../../services/recentlyViewedService';
import { useProductVariant } from '../../hooks/useProductVariant';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onNavigateToCheckout: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onBack, onNavigateToCheckout }) => {
    const { addToCart } = useCart();
    const [showToast, setShowToast] = useState(false);
    
    const {
        selectedOptions,
        selectedVariant,
        quantity,
        optionTypes,
        availableOptions,
        isOptionAvailable,
        handleOptionSelect,
        decreaseQuantity,
        increaseQuantity,
        isOutOfStock,
        mainImage,
        currentPrice,
        originalPrice,
        currentStock
    } = useProductVariant(product);

    useEffect(() => {
        addProductToRecentlyViewed(product.id);
    }, [product]);
    
    const handleAddToCart = () => {
        if (isOutOfStock || !selectedVariant) return;
        addToCart(product, selectedVariant, quantity);
    };
    
    const handleBuyNow = () => {
        if (isOutOfStock || !selectedVariant) return;
        handleAddToCart();
        setShowToast(true);

        setTimeout(() => {
            onNavigateToCheckout();
        }, 2000);
    };

    return (
        <>
        <Toast 
            message="Redirecting to checkout..."
            show={showToast}
            onClose={() => setShowToast(false)}
            duration={2000}
        />
        <div className="bg-background py-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={onBack} className="mb-6 text-sm font-medium text-muted-foreground hover:text-foreground">
                    &larr; Back to all products
                </button>

                <div className="flex-col md:flex-row justify-between flex gap-8 items-start py-10 font-primarylw">
                    <div className="flex bg-white rounded-lg shadow-lg dark:bg-black flex-col md:flex-row border border-gray-400 dark:border-gray-500 mx-auto max-w-3xl">
                        {/* Product Image Section */}
                        <div className="relative w-full md:w-1/2 flex justify-center items-center">
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="object-cover w-full h-48 md:h-full rounded-t-lg md:rounded-l-lg md:rounded-t-none transition-transform transform hover:scale-105 duration-300 ease-in-out"
                            />
                        </div>
                        {/* Product Details Section */}
                        <div className="flex-auto p-6 space-y-5">
                            <div className="flex flex-col flex-wrap items-start justify-between mb-4 gap-1">
                                <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                                    {product.name}
                                </h1>
                                <div className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-300">
                                    Price - {formatCurrency(currentPrice)}
                                    {originalPrice && (
                                      <span className="text-sm line-through text-gray-500 dark:text-gray-400 ml-3">{formatCurrency(originalPrice)}</span>
                                    )}
                                </div>
                            </div>

                             <div className="space-y-4">
                                {optionTypes.map(type => (
                                    <div key={type} className="mb-4">
                                        <h3 className="text-sm font-semibold text-background bg-foreground mb-2 px-2 py-1 rounded-md inline-block">{type}:</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {availableOptions[type]?.map(value => {
                                                 const isAvailable = isOptionAvailable(type, value);
                                                 return (
                                                    <button key={value} onClick={() => handleOptionSelect(type, value)} disabled={!isAvailable} className={cn(
                                                        "px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all",
                                                        selectedOptions[type] === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50",
                                                        !isAvailable && "opacity-50 cursor-not-allowed line-through"
                                                    )}>
                                                        {value}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                <div className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300">
                                    <p className={isOutOfStock ? "text-red-500" : "text-green-500"}>
                                        {isOutOfStock ? "Out of stock" : `${currentStock} in stock`}
                                    </p>
                                </div>
                                {product.deliveryTimescale && (
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <TruckIcon className="h-5 w-5" />
                                    <span>{product.deliveryTimescale}</span>
                                  </div>
                                )}
                            </div>
                            
                            <p className="text-sm text-gray-600 dark:text-gray-400 max-h-24 overflow-y-auto">
                                {product.description}
                            </p>
                            
                            {/* Quantity Selector */}
                            {!isOutOfStock && (
                                <div className="flex items-center space-x-4 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <span className="text-xs md:text-sm">Quantity:</span>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            className="px-3 py-1 bg-gray-200 rounded-lg dark:bg-gray-700 text-gray-800 dark:text-gray-300 disabled:opacity-50"
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <input
                                            id="quantityInput"
                                            type="number"
                                            value={quantity}
                                            readOnly
                                            className="flex items-center justify-center w-10 py-2 px-3 mx-2 text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-1 bg-gray-200 rounded-lg dark:bg-gray-700 text-gray-800 dark:text-gray-300 disabled:opacity-50"
                                            onClick={increaseQuantity}
                                            disabled={quantity >= currentStock}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Add to Cart & Buy Now Buttons */}
                            <div className="flex w-full max-w-xs items-center space-x-2 text-xs md:text-sm">
                                {isOutOfStock ? (
                                    <button
                                        disabled
                                        className="w-full h-8 rounded-lg font-semibold bg-destructive text-destructive-foreground cursor-not-allowed"
                                    >
                                        Out of Stock
                                    </button>
                                ) : (
                                    <>
                                        <AnimatedCartButton
                                            onAddToCart={(e) => { e.stopPropagation(); handleAddToCart(); }}
                                            className="flex-1 font-semibold"
                                            disabled={!selectedVariant}
                                        />
                                        <AnimatedCartButton
                                            onAddToCart={handleBuyNow}
                                            text="Buy Now"
                                            className="flex-1 font-semibold bg-secondary text-secondary-foreground hover:bg-accent"
                                            disabled={!selectedVariant}
                                        />
                                    </>
                                )}
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-300">
                                Free shipping on all continental US orders.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default ProductDetailPage;