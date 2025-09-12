import React, { useState } from 'react';
import type { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../shared/utils';
import AnimatedCartButton from '../shared/AnimatedCartButton';
import Toast from '../shared/Toast';
import { cn } from '../../lib/utils';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onNavigateToCheckout: () => void;
}

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product, onBack, onNavigateToCheckout }) => {
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const [showToast, setShowToast] = useState(false);
    
    // FIX: Product properties like stock, price are on variants. This page does not have a variant selector,
    // so we will use the first variant as the basis for display and actions.
    const firstVariant = product.variants[0];
    // FIX: Property 'stock' does not exist on type 'Product'. Check stock from the selected variant.
    const isOutOfStock = !firstVariant || firstVariant.stock <= 0;

    const decreaseQuantity = () => {
        setQuantity(q => Math.max(1, q - 1));
    };

    const increaseQuantity = () => {
        // FIX: Property 'stock' does not exist on type 'Product'. Use stock from the selected variant.
        setQuantity(q => Math.min(firstVariant.stock, q + 1));
    };

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        
        // FIX: Expected 2-3 arguments, but got 1. The `addToCart` function requires a product and a variant.
        addToCart(product, firstVariant, quantity);
    };
    
    const handleBuyNow = () => {
        if (isOutOfStock) return;
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
                                src={product.imageUrls[0]}
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
                                    {/* FIX: Property 'price' does not exist on type 'Product'. Use price from the selected variant. */}
                                    Price - {formatCurrency(firstVariant.price)}
                                    {/* FIX: Property 'originalPrice' does not exist on type 'Product'. Use originalPrice from the selected variant. */}
                                    {firstVariant.originalPrice && (
                                      // FIX: Property 'originalPrice' does not exist on type 'Product'. Use originalPrice from the selected variant.
                                      <span className="text-sm line-through text-gray-500 dark:text-gray-400 ml-3">{formatCurrency(firstVariant.originalPrice)}</span>
                                    )}
                                </div>
                            </div>
                            <div className="mb-4 text-xs md:text-sm font-medium text-gray-500 dark:text-gray-300">
                                <p className={isOutOfStock ? "text-red-500" : "text-green-500"}>
                                    {isOutOfStock ? "Out of stock" : "In stock"}
                                </p>
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
                                            // FIX: Property 'stock' does not exist on type 'Product'. Use stock from the selected variant.
                                            disabled={quantity >= firstVariant.stock}
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
                                        />
                                        <AnimatedCartButton
                                            onAddToCart={handleBuyNow}
                                            text="Buy Now"
                                            className="flex-1 font-semibold bg-secondary text-secondary-foreground hover:bg-accent"
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
