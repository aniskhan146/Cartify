import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type { Product, CartItem, Variant } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variant: Variant, quantity?: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateItemQuantity: (productId: string, variantId: string, newQuantity: number) => void;
  cartItemCount: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (product: Product, variant: Variant, quantity: number = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === product.id && item.variant.id === variant.id);
            if (existingItem) {
                // Increase quantity if item already exists
                return prevItems.map(item =>
                    (item.productId === product.id && item.variant.id === variant.id) 
                        ? { ...item, quantity: item.quantity + quantity } 
                        : item
                );
            }
            // Add new item
            const newItem: CartItem = {
                productId: product.id,
                productName: product.name,
                productImage: variant.imageUrl || product.imageUrls[0],
                variant: variant,
                quantity: quantity
            };
            return [...prevItems, newItem];
        });
    };

    const removeFromCart = (productId: string, variantId: string) => {
        setCartItems(prevItems => prevItems.filter(item => !(item.productId === productId && item.variant.id === variantId)));
    };

    const updateItemQuantity = (productId: string, variantId: string, newQuantity: number) => {
        setCartItems(prevItems => {
            if (newQuantity <= 0) {
                // If quantity is 0 or less, remove the item
                return prevItems.filter(item => !(item.productId === productId && item.variant.id === variantId));
            }
            // Otherwise, update the quantity
            return prevItems.map(item =>
                (item.productId === productId && item.variant.id === variantId) ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartItemCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    const value: CartContextType = {
        cartItems,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        cartItemCount,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};