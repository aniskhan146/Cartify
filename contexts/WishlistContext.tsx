import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Product } from '../types';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

interface WishlistProviderProps {
    children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const { currentUser } = useAuth();

    const addToWishlist = (product: Product) => {
        if (!currentUser) return; // Wishlist is for logged-in users only
        setWishlistItems(prevItems => {
            if (prevItems.find(item => item.id === product.id)) {
                return prevItems; // Already in wishlist
            }
            return [...prevItems, product];
        });
    };

    const removeFromWishlist = (productId: string) => {
        if (!currentUser) return;
        setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const isInWishlist = useCallback((productId: string): boolean => {
        if (!currentUser) return false;
        return wishlistItems.some(item => item.id === productId);
    }, [wishlistItems, currentUser]);

    const value: WishlistContextType = {
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
