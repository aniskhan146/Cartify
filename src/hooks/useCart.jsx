import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { formatCurrency } from '../lib/utils.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getCartForUser, addOrUpdateCartItem, removeCartItem, clearUserCart } from '../api/EcommerceApi.js'; // You'll need to create these API functions

const CartContext = createContext();

const LOCAL_CART_STORAGE_KEY = 'e-commerce-cart-guest';

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load cart from DB for logged-in user, or from localStorage for guest
  const loadCart = useCallback(async () => {
    setLoading(true);
    if (user) {
        // User is logged in, fetch from database
        try {
            const dbCart = await getCartForUser(user.id);
            setCartItems(dbCart);
            // Clear local guest cart after fetching from DB
            localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to load user cart from database:", error);
        }
    } else {
        // User is a guest, load from local storage
        try {
            const storedCart = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
        } catch (error) {
            console.error("Failed to load guest cart from localStorage:", error);
            setCartItems([]);
        }
    }
    setLoading(false);
  }, [user]);
  
  // Sync local guest cart to DB upon login
  const syncLocalCartToDb = useCallback(async (userId) => {
    try {
      const localCart = JSON.parse(localStorage.getItem(LOCAL_CART_STORAGE_KEY) || '[]');
      if (localCart.length > 0) {
        for (const item of localCart) {
          // This will either add the new item or update the quantity if it exists
          await addOrUpdateCartItem(userId, item.variant.id, item.quantity);
        }
        localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to sync local cart to database:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
        // Sync first, then load the full cart
        syncLocalCartToDb(user.id).then(() => {
            loadCart();
        });
    } else {
        loadCart();
    }
  }, [user, loadCart, syncLocalCartToDb]);


  // Update localStorage whenever cart changes FOR GUESTS
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = useCallback(async (product, variant, quantity) => {
    const existingItem = cartItems.find(item => item.variant.id === variant.id);
    const newQuantity = (existingItem ? existingItem.quantity : 0) + quantity;

    if (variant.manage_inventory && newQuantity > variant.inventory_quantity) {
      throw new Error(`Not enough stock. Only ${variant.inventory_quantity} left.`);
    }

    if (user) {
      // API call for logged-in user
      const updatedItem = await addOrUpdateCartItem(user.id, variant.id, newQuantity);
      setCartItems(prev => {
        const itemExists = prev.some(i => i.variant.id === updatedItem.variant.id);
        if (itemExists) {
            return prev.map(i => i.variant.id === updatedItem.variant.id ? updatedItem : i);
        }
        return [...prev, updatedItem];
      });
    } else {
      // Local storage for guest
      setCartItems(prev => {
        if (existingItem) {
          return prev.map(item =>
            item.variant.id === variant.id
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
        return [...prev, { product, variant, quantity }];
      });
    }
  }, [cartItems, user]);

 const removeFromCart = useCallback(async (variantId) => {
    if (user) {
      await removeCartItem(user.id, variantId);
    }
    setCartItems(prev => prev.filter(item => item.variant.id !== variantId));
  }, [user]);

 const updateQuantity = useCallback(async (variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    const itemToUpdate = cartItems.find(item => item.variant.id === variantId);
    if (!itemToUpdate) return;
    
    if (itemToUpdate.variant.manage_inventory && quantity > itemToUpdate.variant.inventory_quantity) {
       // Optionally throw an error or show a toast
       console.error("Cannot update quantity beyond available stock");
       return;
    }

    if (user) {
      await addOrUpdateCartItem(user.id, variantId, quantity);
    }
    setCartItems(prev =>
      prev.map(item =>
        item.variant.id === variantId ? { ...item, quantity } : item
      )
    );
  }, [cartItems, user, removeFromCart]);

 const clearCart = useCallback(async () => {
    if (user) {
      await clearUserCart(user.id);
    }
    setCartItems([]);
  }, [user]);

  const getCartTotalRaw = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = item.variant.sale_price_in_cents ?? item.variant.price_in_cents;
      return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const getCartTotal = useCallback(() => {
    const totalInCents = getCartTotalRaw();
    return formatCurrency(totalInCents);
  }, [getCartTotalRaw]);


  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartTotalRaw,
    loading,
  }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartTotalRaw, loading]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
};