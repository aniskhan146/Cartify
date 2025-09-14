import { supabase } from '../lib/supabase.js';
import { formatCurrency } from '../lib/utils.js';

const MAX_PRICE_CENTS = 500000; // Corresponds to StorePage constant

// Helper to transform Supabase image URLs for optimization
const transformSupabaseImage = (url, width, height) => {
    if (!url || !url.includes('/storage/v1/object/public/')) {
        return url; // Not a transformable Supabase URL
    }
    const transformedUrl = url.replace('/object/public/', '/render/image/public/');
    return `${transformedUrl}?width=${width}&height=${height}&resize=cover`;
};

// Helper to format product data into the structure expected by components
const formatProduct = (product) => {
    if (!product) return null;
    
    const mainImage = product.image || product.images?.[0]?.url;

    return {
        ...product,
        image: transformSupabaseImage(mainImage, 500, 500),
        // Assumes an 'images' jsonb column like [{ "url": "..." }]
        galleryImages: (product.images?.map(img => img.url) || []),
        variants: (product.variants || []).map(variant => ({
            ...variant,
            price_formatted: formatCurrency(variant.price_in_cents),
            sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
            currency_info: { code: 'USD', symbol: '$', template: '$1' },
        }))
    };
};

// Fetch all products with their variants, with pagination and filtering
export const getProducts = async ({ page = 1, limit = 8, category = 'All', searchTerm = '', sortBy = 'name', priceRange = [0, MAX_PRICE_CENTS] }) => {
    const offset = (page - 1) * limit;

    let productIdsFromPriceFilter = null;

    // Only run the price filter query if the user has adjusted the slider from its max range
    if (priceRange[0] > 0 || priceRange[1] < MAX_PRICE_CENTS) {
        let priceQuery = supabase
            .from('variants')
            .select('product_id')
            .gte('price_in_cents', priceRange[0])
            .lte('price_in_cents', priceRange[1]);

        const { data: variantData, error: variantError } = await priceQuery;
        if (variantError) throw new Error('Failed to filter by price.');
        
        productIdsFromPriceFilter = [...new Set(variantData.map(v => v.product_id))];
        
        // If price filter returns no IDs, no need to query for products.
        if (productIdsFromPriceFilter.length === 0) {
            return { products: [], count: 0 };
        }
    }

    let query = supabase
        .from('products')
        .select('*, variants(*)', { count: 'exact' })
        .eq('purchasable', true);

    if (category !== 'All') {
        query = query.eq('category', category);
    }
    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }

    // Apply price filter IDs if they exist
    if (productIdsFromPriceFilter) {
        query = query.in('id', productIdsFromPriceFilter);
    }

    if (sortBy === 'name') {
        query = query.order('title', { ascending: true });
    }
    // Note: Sorting by price is complex with multiple variants and is best handled by an RPC.
    // The current implementation sorts by name.

    query = query.range(offset, offset + (limit - 1));
    
    const { data: productsData, error: productsError, count } = await query;

    if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error('Failed to load products.');
    }
    
    return { 
        products: (productsData || []).map(formatProduct),
        count: count || 0,
    };
};

// Fetch a single product by its ID
export const getProduct = async (id) => {
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('id', id)
        .single();

    if (productError) {
        console.error('Error fetching product:', productError);
        throw new Error('Product not found.');
    }
    
    return formatProduct(productData);
};

// Fetch related products based on category
export const getRelatedProducts = async (productId, category) => {
    if (!category) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('category', category)
        .neq('id', productId)
        .eq('purchasable', true)
        .limit(4);

    if (error) {
        console.error('Error fetching related products:', error);
        return [];
    }

    return (data || []).map(formatProduct);
};

// Fetch all unique categories
export const getUniqueCategories = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('category');
    if (error) {
      console.error("Error fetching unique categories:", error);
      return [];
    }
    return [...new Set(data.map(p => p.category).filter(Boolean))];
};

// ===== Product Management (Admin) =====

export const createProduct = async (productData, variantsData) => {
    // 1. Insert the product
    const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

    if (productError) throw productError;

    // 2. Add product_id to each variant and insert them
    const variantsWithProductId = variantsData.map(v => ({ ...v, product_id: newProduct.id }));
    const { error: variantsError } = await supabase
        .from('variants')
        .insert(variantsWithProductId);

    if (variantsError) {
        // Rollback product creation if variants fail
        await supabase.from('products').delete().eq('id', newProduct.id);
        throw variantsError;
    }
    
    return { ...newProduct, variants: variantsData };
};

export const updateProduct = async (productId, productData, variantsData) => {
    // 1. Update the product details
    const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId);

    if (productError) throw productError;

    // 2. Upsert variants (update existing, insert new ones)
    const variantsToUpsert = variantsData.map(v => ({ ...v, product_id: productId }));
    const { error: variantsError } = await supabase
        .from('variants')
        .upsert(variantsToUpsert, { onConflict: 'id' });
        
    if (variantsError) throw variantsError;

    // 3. Delete variants that were removed
    const variantIdsToKeep = variantsData.map(v => v.id).filter(Boolean);
    if (variantIdsToKeep.length > 0) {
        const { error: deleteError } = await supabase
            .from('variants')
            .delete()
            .eq('product_id', productId)
            .not('id', 'in', `(${variantIdsToKeep.join(',')})`);
            
        if (deleteError) console.error("Error deleting old variants:", deleteError);
    } else {
        // If all variants are removed (which shouldn't happen with UI constraints but is a good safeguard)
        const { error: deleteAllError } = await supabase
            .from('variants')
            .delete()
            .eq('product_id', productId);
        if (deleteAllError) console.error("Error deleting all variants:", deleteAllError);
    }
};

export const deleteProduct = async (productId) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
    
    if (error) throw error;
};

// ===== Order Management (Admin & Checkout) =====

export const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
};

export const getOrderDetails = async (orderId) => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                variants (
                    *,
                    products (
                        title,
                        image
                    )
                )
            )
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order details:', error);
        throw new Error('Could not retrieve order details.');
    }
    return data;
};

// This function calls a database function (RPC) to safely decrease inventory.
export const decreaseInventory = async (orderId) => {
    const { error } = await supabase.rpc('decrease_inventory_for_order', {
        p_order_id: orderId
    });

    if (error) {
        console.error('Error decreasing inventory:', error);
        throw new Error('Failed to update product stock.');
    }
};
// NOTE: You MUST add the following SQL function to your Supabase project
// via the SQL Editor for the inventory management to work correctly.
/*
CREATE OR REPLACE FUNCTION decrease_inventory_for_order(p_order_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN
        SELECT oi.variant_id, oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = p_order_id
    LOOP
        UPDATE public.variants
        SET inventory_quantity = inventory_quantity - item.quantity
        WHERE id = item.variant_id AND manage_inventory = true;
    END LOOP;
END;
$$;
*/


// ===== Customer Management (Admin) =====

export const getCustomersWithStats = async () => {
    // This uses an RPC function in Supabase for better performance.
    const { data, error } = await supabase.rpc('get_customer_stats');

    if (error) {
        console.error("Error fetching customer stats via RPC:", error);

        // Specific check for missing 'profiles' table which causes the RPC to fail.
        if (error.code === '42P01' || error.message.includes('relation "public.profiles" does not exist')) {
             console.warn("RPC function failed because 'profiles' table is missing. Returning empty customer list. Please run the database setup script.");
             return []; // Prevents crashing the admin page.
        }

        // Fallback to client-side calculation if RPC fails for other reasons
        console.warn("Falling back to client-side customer stat calculation...");
        
        try {
            const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
            if (profileError) {
                // Also handle the missing table error here in the fallback.
                if (profileError.code === '42P01' || profileError.message.includes('relation "public.profiles" does not exist')) {
                     console.warn("'profiles' table not found during fallback. Returning empty customer list. Please run the database setup script.");
                     return [];
                }
                throw profileError;
            }
            
            const { data: orders, error: orderError } = await supabase.from('orders').select('user_id, total');
            if (orderError) throw orderError;
            
            const statsMap = orders.reduce((acc, order) => {
                if (!acc[order.user_id]) {
                    acc[order.user_id] = { totalSpent: 0, orderCount: 0 };
                }
                acc[order.user_id].totalSpent += order.total;
                acc[order.user_id].orderCount += 1;
                return acc;
            }, {});
    
            return profiles.map(profile => ({
                ...profile,
                created_at: profile.created_at,
                total_spent: statsMap[profile.id]?.totalSpent || 0,
                order_count: statsMap[profile.id]?.orderCount || 0,
            }));
        } catch(fallbackError) {
            console.error("Client-side fallback for customer stats also failed:", fallbackError);
            return []; // Return empty array on any fallback failure to prevent crash
        }
    }
    
    return data;
}

// NOTE: You must add the following SQL function to your Supabase project
// via the SQL Editor for the `getCustomersWithStats` function to work optimally.
/*
  CREATE OR REPLACE FUNCTION get_customer_stats()
  RETURNS TABLE(id uuid, email text, role text, created_at timestptz, total_spent bigint, order_count bigint)
  LANGUAGE sql
  AS $$
    SELECT
      p.id,
      p.email,
      p.role,
      (SELECT created_at FROM auth.users WHERE id = p.id) as created_at,
      COALESCE(SUM(o.total), 0)::bigint AS total_spent,
      COALESCE(COUNT(o.id), 0)::bigint AS order_count
    FROM
      public.profiles p
    LEFT JOIN
      public.orders o ON p.id = o.user_id
    GROUP BY
      p.id;
  $$;
*/

// ===== Cart Management =====

// NOTE: You MUST add the following SQL table to your Supabase project for the cart to work.
/*
CREATE TABLE public.cart_items (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id bigint NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, variant_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
*/

export const getCartForUser = async (userId) => {
    const { data, error } = await supabase
        .from('cart_items')
        .select('quantity, variants(*, products(*))')
        .eq('user_id', userId);

    if (error) {
        console.error("Error fetching user cart:", error);
        throw error;
    }

    // Format the data to match the structure expected by the useCart hook
    return data.map(item => {
        const product = item.variants.products;
        const variant = { ...item.variants, products: undefined }; // Clean up nested product
        return {
            quantity: item.quantity,
            product: {
                id: product.id,
                title: product.title,
                image: transformSupabaseImage(product.image, 100, 100),
            },
            variant: {
                ...variant,
                price_formatted: formatCurrency(variant.price_in_cents),
                sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
            }
        };
    });
};

export const addOrUpdateCartItem = async (userId, variantId, quantity) => {
    const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert(
            { user_id: userId, variant_id: variantId, quantity: quantity },
            { onConflict: 'user_id,variant_id' }
        );
        
    if (upsertError) {
        console.error("Error upserting cart item:", upsertError);
        throw upsertError;
    }

    // Fetch the newly updated item to get all joined data for the UI state
    const { data, error: fetchError } = await supabase
        .from('cart_items')
        .select('quantity, variants(*, products(*))')
        .eq('user_id', userId)
        .eq('variant_id', variantId)
        .single();
    
    if (fetchError) {
        console.error("Error fetching updated cart item:", fetchError);
        throw fetchError;
    }

    const product = data.variants.products;
    const variant = { ...data.variants, products: undefined };
    return {
        quantity: data.quantity,
        product: {
            id: product.id,
            title: product.title,
            image: transformSupabaseImage(product.image, 100, 100),
        },
        variant: {
            ...variant,
            price_formatted: formatCurrency(variant.price_in_cents),
            sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
        }
    };
};

export const removeCartItem = async (userId, variantId) => {
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .match({ user_id: userId, variant_id: variantId });

    if (error) {
        console.error("Error removing cart item:", error);
        throw error;
    }
};

export const clearUserCart = async (userId) => {
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error("Error clearing user cart:", error);
        throw error;
    }
};