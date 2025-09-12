import { db } from './firebase';
import { ref, onValue, set, push, remove, update, get } from 'firebase/database';
import type { Product, Category, Order, UserRole, UserRoleInfo, CheckoutConfig } from '../types';

// The category data stored in DB has a different shape than the UI one
export interface DbCategory {
    id: string;
    name: string;
    iconUrl: string;
    productCount: number;
}

// Products
export const onProductsValueChange = (callback: (products: Product[]) => void) => {
  const productsRef = ref(db, 'products');
  return onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    const productsArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(productsArray);
  }, (error) => {
    console.error("Firebase onProductsValueChange failed: ", error);
  });
};

export const saveProduct = (product: Omit<Product, 'id'>, productId?: string) => {
  if (productId) {
    const productRef = ref(db, `products/${productId}`);
    return update(productRef, product);
  } else {
    const productsRef = ref(db, 'products');
    const newProductRef = push(productsRef);
    return set(newProductRef, product);
  }
};

export const deleteProduct = (productId: string) => {
  const productRef = ref(db, `products/${productId}`);
  return remove(productRef);
};


// Categories
export const onCategoriesValueChange = (callback: (categories: DbCategory[]) => void) => {
    const categoriesRef = ref(db, 'categories');
    return onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        const categoriesArray: DbCategory[] = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
        callback(categoriesArray);
    }, (error) => {
        console.error("Firebase onCategoriesValueChange failed: ", error);
    });
};

export const saveCategory = (category: { name: string; iconUrl: string; productCount: number }, categoryId?: string) => {
    if (categoryId) {
        const categoryRef = ref(db, `categories/${categoryId}`);
        return update(categoryRef, category);
    } else {
        const categoriesRef = ref(db, 'categories');
        const newCategoryRef = push(categoriesRef);
        return set(newCategoryRef, category);
    }
};

export const deleteCategory = (categoryId: string) => {
    const categoryRef = ref(db, `categories/${categoryId}`);
    return remove(categoryRef);
};

// Store Settings
export const onHeroImagesChange = (callback: (images: string[]) => void) => {
    const heroImagesRef = ref(db, 'publicStorefront/heroImages');
    return onValue(heroImagesRef, (snapshot) => {
        const data = snapshot.val();
        const imagesArray: string[] = data || []; // Default to empty array if null
        callback(imagesArray);
    }, (error) => {
        console.error("Firebase onHeroImagesChange failed: ", error);
    });
};

export const saveHeroImages = (images: string[]) => {
    const heroImagesRef = ref(db, 'publicStorefront/heroImages');
    return set(heroImagesRef, images);
};

// Checkout Config
export const onCheckoutConfigChange = (callback: (config: CheckoutConfig) => void) => {
    const configRef = ref(db, 'publicStorefront/checkoutConfig');
    return onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        // Provide sensible defaults if no config is set in the DB yet
        const config: CheckoutConfig = data || { shippingCharge: 40, taxAmount: 4 };
        callback(config);
    }, (error) => {
        console.error("Firebase onCheckoutConfigChange failed: ", error);
    });
};

export const saveCheckoutConfig = (config: CheckoutConfig) => {
    const configRef = ref(db, 'publicStorefront/checkoutConfig');
    return set(configRef, config);
};


// Orders
export const placeOrder = (userId: string, orderData: Omit<Order, 'id'>) => {
  const userOrdersRef = ref(db, `orders/${userId}`);
  const newOrderRef = push(userOrdersRef);
  // We need to get the key to return it or use it. Firebase returns the ref, which has the key.
  // The push operation automatically generates a unique ID, which we will use as our order ID.
  return set(newOrderRef, orderData);
};


export const findOrderById = async (orderIdToFind: string): Promise<Order | null> => {
    const ordersRef = ref(db, 'orders');
    try {
        const snapshot = await get(ordersRef);
        if (snapshot.exists()) {
            const allUsersOrders = snapshot.val();
            for (const userId in allUsersOrders) {
                const userOrders = allUsersOrders[userId];
                if (userOrders[orderIdToFind]) {
                    return { ...userOrders[orderIdToFind], id: orderIdToFind };
                }
            }
        }
        return null; // Not found
    } catch (error) {
        console.error("Error finding order by ID:", error);
        throw new Error("Failed to search for the order.");
    }
};


export const onUserOrdersValueChange = (userId: string, callback: (orders: Order[]) => void) => {
  const userOrdersRef = ref(db, `orders/${userId}`);
  return onValue(userOrdersRef, (snapshot) => {
    const data = snapshot.val();
    const ordersArray = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
    callback(ordersArray);
  }, (error) => {
    console.error("Firebase onUserOrdersValueChange failed: ", error);
  });
};

export const fetchAllOrders = async (): Promise<(Order & { userId: string })[]> => {
  const usersRef = ref(db, 'users');
  const usersSnapshot = await get(usersRef);
  const usersData = usersSnapshot.val();
  if (!usersData) {
    return [];
  }
  const userIds = Object.keys(usersData);

  const allOrdersPromises = userIds.map(userId => 
    get(ref(db, `orders/${userId}`)).then(snapshot => ({ userId, snapshot }))
  );
  
  const allUserOrdersSnapshots = await Promise.all(allOrdersPromises);

  const allOrders: (Order & { userId: string })[] = [];
  allUserOrdersSnapshots.forEach(({ userId, snapshot }) => {
    const userOrdersData = snapshot.val();
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
  const ordersRef = ref(db, 'orders');
  return onValue(ordersRef, (snapshot) => {
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
};


export const updateOrderStatus = (userId: string, orderId: string, newStatus: Order['status']) => {
    if (!userId || !orderId) {
        throw new Error("User ID and Order ID are required to update status.");
    }
    const orderStatusRef = ref(db, `orders/${userId}/${orderId}/status`);
    return set(orderStatusRef, newStatus);
};

export const deleteOrder = (userId: string, orderId: string) => {
    if (!userId || !orderId) {
        throw new Error("User ID and Order ID are required to delete an order.");
    }
    const orderRef = ref(db, `orders/${userId}/${orderId}`);
    return remove(orderRef);
};


// Roles & User Management
export const createUserRoleAndProfile = (userId: string, email: string) => {
  const userProfileRef = ref(db, `users/${userId}`);
  
  const role: UserRole = email.toLowerCase() === 'kanis8871@gmail.com' ? 'admin' : 'user';

  // Store email, role, and default banned status
  return set(userProfileRef, { email, role, isBanned: false });
};

export const getUserProfile = async (userId: string): Promise<UserRoleInfo | null> => {
  const userProfileRef = ref(db, `users/${userId}`);
  try {
    const snapshot = await get(userProfileRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        uid: userId,
        email: data.email,
        role: data.role || 'user',
        isBanned: data.isBanned || false
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const onAllUsersAndRolesValueChange = (callback: (users: UserRoleInfo[]) => void) => {
  const usersRef = ref(db, 'users');
  
  return onValue(usersRef, (snapshot) => {
    const usersData = snapshot.val() || {};
    
    const combinedData: UserRoleInfo[] = Object.keys(usersData).map(uid => ({
      uid: uid,
      email: usersData[uid]?.email || 'Email not available',
      role: (usersData[uid]?.role as UserRole) || 'user',
      isBanned: usersData[uid]?.isBanned || false,
    }));
    
    callback(combinedData);
  }, (error) => {
    console.error("Firebase onAllUsersAndRolesValueChange failed: ", error);
  });
};

export const updateUserRole = (userId: string, newRole: UserRole) => {
  const userRoleRef = ref(db, `users/${userId}/role`);
  return set(userRoleRef, newRole);
};

export const setUserBanStatus = (userId: string, isBanned: boolean) => {
  const userBanRef = ref(db, `users/${userId}/isBanned`);
  return set(userBanRef, isBanned);
};

export const deleteUserRecord = (userId: string) => {
  // This only deletes the user's record from the Realtime Database.
  // It does NOT delete the user from Firebase Authentication.
  // For a full user deletion, a Firebase Cloud Function is required.
  const userRef = ref(db, `users/${userId}`);
  return remove(userRef);
};