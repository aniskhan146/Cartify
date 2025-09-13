import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { Product } from '../types';
import { useAuth } from './AuthContext';
import { onWishlistChange, updateWishlist, onProductsValueChange } from '../services/databaseService';

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
    const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
    const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const { currentUser } = useAuth();

    useEffect(() => {
        const unsubscribe = onProductsValueChange(setAllProducts);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = onWishlistChange(currentUser.uid, (productIds) => {
                setWishlistProductIds(new Set(productIds));
            });
            return () => unsubscribe();
        } else {
            setWishlistProductIds(new Set());
        }
    }, [currentUser]);

    useEffect(() => {
        if (allProducts.length > 0) {
            const productMap = new Map(allProducts.map(p => [p.id, p]));
            const items = Array.from(wishlistProductIds)
                .map(id => productMap.get(id))
                .filter((p): p is Product => p !== undefined);
            setWishlistItems(items);
        } else {
            setWishlistItems([]);
        }
    }, [wishlistProductIds, allProducts]);

    const updateRemoteWishlist = (newIdSet: Set<string>) => {
        if (currentUser) {
            updateWishlist(currentUser.uid, Array.from(newIdSet));
        }
    };

    const addToWishlist = (product: Product) => {
        if (!currentUser) return;
        const newIdSet = new Set(wishlistProductIds);
        newIdSet.add(product.id);
        setWishlistProductIds(newIdSet);
        updateRemoteWishlist(newIdSet);
    };

    const removeFromWishlist = (productId: string) => {
        if (!currentUser) return;
        const newIdSet = new Set(wishlistProductIds);
        newIdSet.delete(productId);
        setWishlistProductIds(newIdSet);
        updateRemoteWishlist(newIdSet);
    };

    const isInWishlist = useCallback((productId: string): boolean => {
        return wishlistProductIds.has(productId);
    }, [wishlistProductIds]);

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