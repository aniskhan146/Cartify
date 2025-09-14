import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchWishlist = useCallback(async () => {
        if (!user) {
            setWishlist(new Set());
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Assumes a 'wishlist' table with user_id and product_id
            const { data, error } = await supabase
                .from('wishlist')
                .select('product_id')
                .eq('user_id', user.id);
            if (error) {
                // If the table doesn't exist, it will fail gracefully.
                if (error.code === '42P01') {
                    console.warn("Wishlist feature may not be fully configured: 'wishlist' table not found.");
                    setWishlist(new Set());
                } else {
                    throw error;
                }
            } else {
                 setWishlist(new Set(data.map(item => item.product_id)));
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWishlist();
    }, [fetchWishlist]);

    const addToWishlist = async (productId) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
            if (error) throw error;
            setWishlist(prev => new Set(prev).add(productId));
        } catch (error) {
            console.error("Error adding to wishlist:", error);
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
            if (error) throw error;
            setWishlist(prev => {
                const newWishlist = new Set(prev);
                newWishlist.delete(productId);
                return newWishlist;
            });
        } catch (error) {
            console.error("Error removing from wishlist:", error);
        }
    };
    
    const isWishlisted = (productId) => wishlist.has(productId);
    
    const value = { 
        wishlist, 
        isWishlisted, 
        addToWishlist, 
        removeFromWishlist, 
        loading, 
        wishlistCount: wishlist.size 
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}