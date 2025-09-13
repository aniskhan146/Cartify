import { supabase } from './supabaseClient';
import type { Product, Category, Order, UserRole, UserRoleInfo, CheckoutConfig, VariantOption } from '../types';

// The category data stored in DB has a different shape than the UI one
export interface DbCategory {
    id: string;
    name: string;
    iconUrl: string;
    productCount: number;
}

// Helper for handling Supabase errors
const handleSupabaseError = (error: any, context: string) => {
    if (error) {
        console.error(`Supabase error in ${context}:`, error.message);
        throw new Error(`Database operation failed: ${context}.`);
    }
};

// --- Mappers for camelCase <-> snake_case conversion ---

const mapProductFromDb = (dbProduct: any): Product => ({
    id: dbProduct.id,
    name: dbProduct.name,
    category: dbProduct.category,
    description: dbProduct.description,
    imageUrls: dbProduct.image_urls || [],
    rating: dbProduct.rating,
    reviews: dbProduct.reviews,
    variants: dbProduct.variants || [],
    deliveryTimescale: dbProduct.delivery_timescale,
});

const mapProductForDb = (product: Partial<Omit<Product, 'id'>>) => {
    const { imageUrls, deliveryTimescale, ...rest } = product;
    return {
        ...rest,
        image_urls: imageUrls,
        delivery_timescale: deliveryTimescale,
    };
};

const mapCategoryFromDb = (dbCategory: any): DbCategory => ({
    id: dbCategory.id,
    name: dbCategory.name,
    iconUrl: dbCategory.icon_url,
    productCount: dbCategory.product_count,
});

const mapCategoryForDb = (category: Partial<Omit<DbCategory, 'id'>>) => {
    const { iconUrl, productCount, ...rest } = category;
    return {
        ...rest,
        icon_url: iconUrl,
        product_count: productCount,
    };
};

const mapOrderFromDb = (dbOrder: any): Order => ({
    id: dbOrder.id,
    customerName: dbOrder.customer_name,
    date: dbOrder.date,
    total: dbOrder.total,
    status: dbOrder.status,
    items: dbOrder.items || [],
});

const mapOrderWithUserFromDb = (dbOrder: any): Order & { userId: string } => ({
    ...mapOrderFromDb(dbOrder),
    userId: dbOrder.user_id,
});

const mapOrderForDb = (order: Partial<Omit<Order, 'id'>>) => {
    const { customerName, ...rest } = order;
    return {
        ...rest,
        customer_name: customerName,
    };
};


// Products
export const onProductsValueChange = (callback: (products: Product[]) => void) => {
  const fetchAndCallback = async () => {
      const { data, error } = await supabase.from('products').select('*');
      handleSupabaseError(error, 'onProductsValueChange initial fetch');
      callback((data || []).map(mapProductFromDb));
  };
  fetchAndCallback(); // Initial fetch

  const channel = supabase.channel('public:products')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchAndCallback();
    }).subscribe();
  
  return () => { supabase.removeChannel(channel) };
};

export const fetchAllProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*');
    handleSupabaseError(error, 'fetchAllProducts');
    return (data || []).map(mapProductFromDb);
};

export const saveProduct = async (product: Omit<Product, 'id'>, productId?: string) => {
  const productData = mapProductForDb(product);
  const payload = productId ? { ...productData, id: productId } : productData;
  const { error } = await supabase.from('products').upsert(payload);
  handleSupabaseError(error, 'saveProduct');
};

export const deleteProduct = async (productId: string) => {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  handleSupabaseError(error, 'deleteProduct');
};


// Categories
export const onCategoriesValueChange = (callback: (categories: DbCategory[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('categories').select('*');
        handleSupabaseError(error, 'onCategoriesValueChange initial fetch');
        callback((data || []).map(mapCategoryFromDb));
    };
    fetchAndCallback();

    const channel = supabase.channel('public:categories')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const getCategoryByName = async (name: string): Promise<DbCategory | null> => {
    const { data, error } = await supabase.from('categories').select('*').ilike('name', name).limit(1);
    handleSupabaseError(error, 'getCategoryByName');
    return data && data.length > 0 ? mapCategoryFromDb(data[0]) : null;
};


export const saveCategory = async (category: Omit<DbCategory, 'id'>, categoryId?: string) => {
    const categoryData = mapCategoryForDb(category);
    const payload = categoryId ? { ...categoryData, id: categoryId } : categoryData;
    const { error } = await supabase.from('categories').upsert(payload);
    handleSupabaseError(error, 'saveCategory');
};

export const deleteCategory = async (categoryId: string) => {
    const { data: products } = await supabase.from('products').select('id').eq('category', (await supabase.from('categories').select('name').eq('id', categoryId).single()).data?.name);
    if ((products?.length ?? 0) > 0) {
        throw new Error('Cannot delete category with associated products.');
    }
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    handleSupabaseError(error, 'deleteCategory');
};

// Variant Options
export const onVariantOptionsChange = (callback: (options: VariantOption[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('variant_options').select('*');
        handleSupabaseError(error, 'onVariantOptionsChange initial fetch');
        callback(data || []);
    };
    fetchAndCallback();

    const channel = supabase.channel('public:variant_options')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'variant_options' }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const getVariantOptionByName = async (name: string): Promise<VariantOption | null> => {
    const { data, error } = await supabase.from('variant_options').select('*').ilike('name', name).limit(1);
    handleSupabaseError(error, 'getVariantOptionByName');
    return data?.[0] || null;
};

export const saveVariantOption = async (option: Omit<VariantOption, 'id'>, optionId?: string) => {
    const payload = optionId ? { ...option, id: optionId } : option;
    const { error } = await supabase.from('variant_options').upsert(payload);
    handleSupabaseError(error, 'saveVariantOption');
};

export const deleteVariantOption = async (optionId: string) => {
    const { error } = await supabase.from('variant_options').delete().eq('id', optionId);
    handleSupabaseError(error, 'deleteVariantOption');
};

// Store Settings
const SETTINGS_ID = 1; // Assuming a single row for all settings

export const onHeroImagesChange = (callback: (images: string[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('storefront_settings').select('hero_images').eq('id', SETTINGS_ID).single();
        handleSupabaseError(error, 'onHeroImagesChange initial fetch');
        callback(data?.hero_images || []);
    };
    fetchAndCallback();

    const channel = supabase.channel('public:storefront_settings')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'storefront_settings', filter: `id=eq.${SETTINGS_ID}` }, payload => {
            callback((payload.new as any).hero_images || []);
        })
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const getHeroImages = async (): Promise<string[]> => {
    const { data, error } = await supabase.from('storefront_settings').select('hero_images').eq('id', SETTINGS_ID).single();
    handleSupabaseError(error, 'getHeroImages');
    return data?.hero_images || [];
};

export const saveHeroImages = async (images: string[]) => {
    const { error } = await supabase.from('storefront_settings').upsert({ id: SETTINGS_ID, hero_images: images });
    handleSupabaseError(error, 'saveHeroImages');
};


// Checkout Config
export const onCheckoutConfigChange = (callback: (config: CheckoutConfig) => void) => {
    const defaultConfig = { shippingChargeInsideDhaka: 60, shippingChargeOutsideDhaka: 120, taxAmount: 4 };
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('storefront_settings').select('checkout_config').eq('id', SETTINGS_ID).single();
        // Do not throw error if not found, just use default
        if (error && error.code !== 'PGRST116') handleSupabaseError(error, 'onCheckoutConfigChange fetch');
        callback(data?.checkout_config || defaultConfig);
    };
    fetchAndCallback();
    
    const channel = supabase.channel('public:storefront_settings_checkout')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'storefront_settings', filter: `id=eq.${SETTINGS_ID}` }, payload => {
             callback((payload.new as any).checkout_config || defaultConfig);
        })
        .subscribe();

    return () => { supabase.removeChannel(channel) };
};

export const saveCheckoutConfig = async (config: CheckoutConfig) => {
    const { error } = await supabase.from('storefront_settings').upsert({ id: SETTINGS_ID, checkout_config: config });
    handleSupabaseError(error, 'saveCheckoutConfig');
};


// Orders
export const placeOrder = async (userId: string, orderData: Omit<Order, 'id'>): Promise<string> => {
    const dbOrderData = mapOrderForDb(orderData);
    const { data, error } = await supabase.from('orders').insert({ user_id: userId, ...dbOrderData }).select('id').single();
    handleSupabaseError(error, 'placeOrder');
    if (!data?.id) throw new Error("Failed to create order: No ID returned.");
    return data.id;
};

export const findOrderById = async (orderIdToFind: string): Promise<Order | null> => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderIdToFind).single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is not an error here
       handleSupabaseError(error, 'findOrderById');
    }
    return data ? mapOrderFromDb(data) : null;
};

export const fetchOrderById = async (userId: string, orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).eq('id', orderId).single();
    if (error && error.code !== 'PGRST116') {
       handleSupabaseError(error, 'fetchOrderById');
    }
    return data ? mapOrderFromDb(data) : null;
}

export const onUserOrdersValueChange = (userId: string, callback: (orders: Order[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId);
        handleSupabaseError(error, 'onUserOrdersValueChange initial fetch');
        callback((data || []).map(mapOrderFromDb));
    };
    fetchAndCallback();

    const channel = supabase.channel(`public:orders:user_id=eq.${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const fetchAllOrders = async (): Promise<(Order & { userId: string })[]> => {
    const { data, error } = await supabase.from('orders').select('*, user_id').order('date', { ascending: false });
    handleSupabaseError(error, 'fetchAllOrders');
    return (data || []).map(mapOrderWithUserFromDb);
};

export const onAllOrdersValueChange = (callback: (orders: (Order & { userId: string })[]) => void) => {
    const fetchAndCallback = async () => {
        const allOrders = await fetchAllOrders();
        callback(allOrders);
    };
    fetchAndCallback();

    const channel = supabase.channel('public:orders:all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const updateOrderStatus = async (userId: string, orderId: string, newStatus: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    handleSupabaseError(error, 'updateOrderStatus');
};

export const deleteOrder = async (userId: string, orderId: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    handleSupabaseError(error, 'deleteOrder');
};

// Roles & User Management
export const createUserRoleAndProfile = async (userId: string, email: string) => {
    const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    handleSupabaseError(countError, 'counting users');

    let role: UserRole = 'user';
    if (email.toLowerCase() === 'admin@ayexpress.com' || count === 0) {
        role = 'admin';
    }
    
    const { error } = await supabase.from('profiles').insert({ uid: userId, email, role, is_banned: false });
    handleSupabaseError(error, 'createUserRoleAndProfile');
};

export const getUserProfile = async (userId: string): Promise<UserRoleInfo | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('uid', userId).single();
    if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'getUserProfile');
    }
    if (!data) return null;
    return { uid: data.uid, email: data.email, role: data.role, isBanned: data.is_banned };
};

export const findUserByEmail = async (email: string): Promise<UserRoleInfo | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).single();
    if (error && error.code !== 'PGRST116') {
        handleSupabaseError(error, 'findUserByEmail');
    }
    if (!data) return null;
    return { uid: data.uid, email: data.email, role: data.role, isBanned: data.is_banned };
};

export const onAllUsersAndRolesValueChange = (callback: (users: UserRoleInfo[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        handleSupabaseError(error, 'onAllUsersAndRolesValueChange fetch');
        const profiles = (data || []).map(p => ({ uid: p.uid, email: p.email, role: p.role, isBanned: p.is_banned }));
        callback(profiles);
    };
    fetchAndCallback();

    const channel = supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const fetchAllUsers = async (): Promise<UserRoleInfo[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    handleSupabaseError(error, 'fetchAllUsers');
    return (data || []).map(p => ({ uid: p.uid, email: p.email, role: p.role, isBanned: p.is_banned }));
};

export const updateUserRole = async (userId: string, newRole: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('uid', userId);
    handleSupabaseError(error, 'updateUserRole');
};

export const setUserBanStatus = async (userId: string, isBanned: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('uid', userId);
    handleSupabaseError(error, 'setUserBanStatus');
};

export const deleteUserRecord = async (userId: string) => {
    // Note: This only deletes from the public 'profiles' table.
    // Deleting the auth user requires admin privileges and is done server-side.
    const { error } = await supabase.from('profiles').delete().eq('uid', userId);
    handleSupabaseError(error, 'deleteUserRecord');
};

// Wishlist
export const onWishlistChange = (userId: string, callback: (productIds: string[]) => void) => {
    const fetchAndCallback = async () => {
        const { data, error } = await supabase.from('wishlists').select('product_id').eq('user_id', userId);
        handleSupabaseError(error, 'onWishlistChange fetch');
        callback((data || []).map(item => item.product_id));
    };
    fetchAndCallback();

    const channel = supabase.channel(`public:wishlists:user_id=eq.${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlists', filter: `user_id=eq.${userId}` }, fetchAndCallback)
        .subscribe();
    return () => { supabase.removeChannel(channel) };
};

export const updateWishlist = async (userId: string, productIds: string[]) => {
    // This is a more complex operation in SQL. We delete all, then insert all.
    // In a high-traffic app, a more nuanced approach would be better.
    const { error: deleteError } = await supabase.from('wishlists').delete().eq('user_id', userId);
    handleSupabaseError(deleteError, 'updateWishlist (delete)');

    if (productIds.length > 0) {
        const rowsToInsert = productIds.map(productId => ({ user_id: userId, product_id: productId }));
        const { error: insertError } = await supabase.from('wishlists').insert(rowsToInsert);
        handleSupabaseError(insertError, 'updateWishlist (insert)');
    }
};

// Newsletter
export const subscribeToNewsletter = async (email: string) => {
    const { error } = await supabase.from('newsletter_subscriptions').insert({ email });
    handleSupabaseError(error, 'subscribeToNewsletter');
};