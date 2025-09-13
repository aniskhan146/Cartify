import { db } from './firebase';
import type { Product, Category, Order, UserRole, UserRoleInfo, CheckoutConfig, VariantOption } from '../types';

// The category data stored in DB has a different shape than the UI one
export interface DbCategory {
    id: string;
    name: string;
    iconUrl: string;
    productCount: number;
}

// Products
export const onProductsValueChange = (callback: (products: Product[]) => void) => {
  const productsRef = db.ref('products');
  const listener = productsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const productsArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(productsArray);
  }, (error) => {
    console.error("Firebase onProductsValueChange failed: ", error);
  });
  
  return () => productsRef.off('value', listener);
};

export const saveProduct = async (product: Omit<Product, 'id'>, productId?: string) => {
  if (productId) {
    const productRef = db.ref(`products/${productId}`);
    return productRef.update(product);
  } else {
    const productsRef = db.ref('products');
    const newProductRef = productsRef.push();
    return newProductRef.set(product);
  }
};

export const deleteProduct = (productId: string) => {
  const productRef = db.ref(`products/${productId}`);
  return productRef.remove();
};


// Categories
export const onCategoriesValueChange = (callback: (categories: DbCategory[]) => void) => {
    const categoriesRef = db.ref('categories');
    const listener = categoriesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const categoriesArray: DbCategory[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(categoriesArray);
    }, (error) => {
        console.error("Firebase onCategoriesValueChange failed: ", error);
    });
    return () => categoriesRef.off('value', listener);
};

export const getCategoryByName = async (name: string): Promise<(DbCategory & { id: string }) | null> => {
    const snapshot = await db.ref('categories').once('value');
    if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const foundId = Object.keys(categoriesData).find(id => categoriesData[id].name.toLowerCase() === name.toLowerCase());
        if (foundId) {
            return {
                id: foundId,
                ...categoriesData[foundId]
            };
        }
    }
    return null;
};


export const saveCategory = (category: { name: string; iconUrl: string; productCount: number }, categoryId?: string) => {
    if (categoryId) {
        return db.ref(`categories/${categoryId}`).update(category);
    } else {
        return db.ref('categories').push(category);
    }
};

export const deleteCategory = (categoryId: string) => {
    return db.ref(`categories/${categoryId}`).remove();
};

// Variant Options
export const onVariantOptionsChange = (callback: (options: VariantOption[]) => void) => {
  const optionsRef = db.ref('variantOptions');
  const listener = optionsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const optionsArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(optionsArray);
  }, (error) => {
    console.error("Firebase onVariantOptionsChange failed: ", error);
  });
  return () => optionsRef.off('value', listener);
};

export const getVariantOptionByName = async (name: string): Promise<VariantOption | null> => {
    const snapshot = await db.ref('variantOptions').once('value');
    if (snapshot.exists()) {
        const optionsData = snapshot.val();
        const foundId = Object.keys(optionsData).find(id => optionsData[id].name.toLowerCase() === name.toLowerCase());
        if (foundId) {
            return {
                id: foundId,
                ...optionsData[foundId]
            };
        }
    }
    return null;
};

export const saveVariantOption = (option: Omit<VariantOption, 'id'>, optionId?: string) => {
  if (optionId) {
    return db.ref(`variantOptions/${optionId}`).update(option);
  } else {
    return db.ref('variantOptions').push(option);
  }
};

export const deleteVariantOption = (optionId: string) => {
  return db.ref(`variantOptions/${optionId}`).remove();
};

// Store Settings
export const getHeroImages = async (): Promise<string[]> => {
    const snapshot = await db.ref('publicStorefront/heroImages').once('value');
    return snapshot.val() || [];
};

export const onHeroImagesChange = (callback: (images: string[]) => void) => {
    const heroImagesRef = db.ref('publicStorefront/heroImages');
    const listener = heroImagesRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const imagesArray: string[] = data || [];
        callback(imagesArray);
    }, (error) => {
        console.error("Firebase onHeroImagesChange failed: ", error);
    });
    return () => heroImagesRef.off('value', listener);
};

export const saveHeroImages = (images: string[]) => {
    return db.ref('publicStorefront/heroImages').set(images);
};

// Checkout Config
export const onCheckoutConfigChange = (callback: (config: CheckoutConfig) => void) => {
    const configRef = db.ref('publicStorefront/checkoutConfig');
    const listener = configRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const config: CheckoutConfig = data || { shippingChargeInsideDhaka: 60, shippingChargeOutsideDhaka: 120, taxAmount: 4 };
        callback(config);
    }, (error) => {
        console.error("Firebase onCheckoutConfigChange failed: ", error);
    });
    return () => configRef.off('value', listener);
};

export const saveCheckoutConfig = (config: CheckoutConfig) => {
    return db.ref('publicStorefront/checkoutConfig').set(config);
};


// Orders
export const placeOrder = async (userId: string, orderData: Omit<Order, 'id'>): Promise<string> => {
  const newOrderRef = db.ref(`orders/${userId}`).push();
  await newOrderRef.set(orderData);
  if (!newOrderRef.key) {
    throw new Error("Failed to create a new order: No key returned from Firebase.");
  }
  return newOrderRef.key;
};


export const findOrderById = async (orderIdToFind: string): Promise<Order | null> => {
    try {
        const snapshot = await db.ref('orders').once('value');
        if (snapshot.exists()) {
            const allUsersOrders = snapshot.val();
            for (const userId in allUsersOrders) {
                const userOrders = allUsersOrders[userId];
                if (userOrders[orderIdToFind]) {
                    return { ...userOrders[orderIdToFind], id: orderIdToFind };
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Error finding order by ID:", error);
        throw new Error("Failed to search for the order.");
    }
};

export const fetchOrderById = async (userId: string, orderId: string): Promise<Order | null> => {
  try {
    const snapshot = await db.ref(`orders/${userId}/${orderId}`).once('value');
    if (snapshot.exists()) {
      return { ...snapshot.val(), id: orderId };
    }
    return null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw new Error("Failed to fetch the order details.");
  }
}


export const onUserOrdersValueChange = (userId: string, callback: (orders: Order[]) => void) => {
  const userOrdersRef = db.ref(`orders/${userId}`);
  const listener = userOrdersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    const ordersArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(ordersArray);
  }, (error) => {
    console.error("Firebase onUserOrdersValueChange failed: ", error);
  });
  return () => userOrdersRef.off('value', listener);
};

export const fetchAllOrders = async (): Promise<(Order & { userId: string })[]> => {
  const usersSnapshot = await db.ref('users').once('value');
  const usersData = usersSnapshot.val();
  if (!usersData) return [];

  const allOrdersSnapshot = await db.ref('orders').once('value');
  const allOrdersData = allOrdersSnapshot.val() || {};
  
  const allOrders: (Order & { userId: string })[] = [];
  Object.keys(allOrdersData).forEach(userId => {
    const userOrdersData = allOrdersData[userId];
    if (userOrdersData) {
      Object.keys(userOrdersData).forEach(orderId => {
        allOrders.push({ ...userOrdersData[orderId], id: orderId, userId });
      });
    }
  });
  
  allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return allOrders;
};

export const onAllOrdersValueChange = (callback: (orders: (Order & { userId: string })[]) => void) => {
  const ordersRef = db.ref('orders');
  const listener = ordersRef.on('value', (snapshot) => {
    const allOrdersData = snapshot.val();
    const allOrders: (Order & { userId: string })[] = [];
    if (allOrdersData) {
      Object.keys(allOrdersData).forEach(userId => {
        const userOrdersData = allOrdersData[userId];
        if (userOrdersData) {
          Object.keys(userOrdersData).forEach(orderId => {
            allOrders.push({ ...userOrdersData[orderId], id: orderId, userId });
          });
        }
      });
    }
    allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(allOrders);
  }, (error) => {
    console.error("Firebase onAllOrdersValueChange failed: ", error);
  });
  return () => ordersRef.off('value', listener);
};


export const updateOrderStatus = (userId: string, orderId: string, newStatus: Order['status']) => {
    if (!userId || !orderId) throw new Error("User ID and Order ID are required to update status.");
    return db.ref(`orders/${userId}/${orderId}/status`).set(newStatus);
};

export const deleteOrder = (userId: string, orderId: string) => {
    if (!userId || !orderId) throw new Error("User ID and Order ID are required to delete an order.");
    return db.ref(`orders/${userId}/${orderId}`).remove();
};


// Roles & User Management
export const createUserRoleAndProfile = (userId: string, email: string) => {
  const SUPER_ADMIN_UID = 'MiaPLwEX7MRy4Mm7O2DNyWVr07T2';
  const role: UserRole = userId === SUPER_ADMIN_UID ? 'admin' : 'user';
  return db.ref(`users/${userId}`).set({ email, role, isBanned: false });
};

export const getUserProfile = async (userId: string): Promise<UserRoleInfo | null> => {
  try {
    const snapshot = await db.ref(`users/${userId}`).once('value');
    if (snapshot.exists()) {
      const data = snapshot.val();
      return { uid: userId, email: data.email, role: data.role || 'user', isBanned: data.isBanned || false };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<UserRoleInfo | null> => {
    const snapshot = await db.ref('users').once('value');
    if (snapshot.exists()) {
        const usersData = snapshot.val();
        const foundUid = Object.keys(usersData).find(uid => usersData[uid].email.toLowerCase() === email.toLowerCase());
        if (foundUid) {
            return { uid: foundUid, ...usersData[foundUid] };
        }
    }
    return null;
};

export const onAllUsersAndRolesValueChange = (callback: (users: UserRoleInfo[]) => void) => {
  const usersRef = db.ref('users');
  const listener = usersRef.on('value', (snapshot) => {
    const usersData = snapshot.val() || {};
    const combinedData: UserRoleInfo[] = Object.keys(usersData).map(uid => ({
      uid: uid,
      email: usersData[uid]?.email || 'N/A',
      role: (usersData[uid]?.role as UserRole) || 'user',
      isBanned: usersData[uid]?.isBanned || false,
    }));
    callback(combinedData);
  }, (error) => {
    console.error("Firebase onAllUsersAndRolesValueChange failed: ", error);
  });
  return () => usersRef.off('value', listener);
};

export const updateUserRole = (userId: string, newRole: UserRole) => {
  return db.ref(`users/${userId}/role`).set(newRole);
};

export const setUserBanStatus = (userId: string, isBanned: boolean) => {
  return db.ref(`users/${userId}/isBanned`).set(isBanned);
};

export const deleteUserRecord = (userId: string) => {
  return db.ref(`users/${userId}`).remove();
};

// Wishlist
export const onWishlistChange = (userId: string, callback: (productIds: string[]) => void) => {
  const wishlistRef = db.ref(`wishlists/${userId}`);
  const listener = wishlistRef.on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data ? Object.keys(data) : []);
  }, (error) => {
      console.error("Firebase onWishlistChange failed:", error);
  });
  return () => wishlistRef.off('value', listener);
};

export const updateWishlist = (userId: string, productIds: string[]) => {
  const updates: { [key: string]: boolean | null } = {};
  productIds.forEach(id => {
      updates[id] = true;
  });
  return db.ref(`wishlists/${userId}`).set(updates);
};

// Newsletter
export const subscribeToNewsletter = async (email: string) => {
    const subscriptionsRef = db.ref('newsletterSubscriptions');
    const newSubscriptionRef = subscriptionsRef.push();
    return newSubscriptionRef.set({
        email: email,
        subscribedAt: new Date().toISOString()
    });
};