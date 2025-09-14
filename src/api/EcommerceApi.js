import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

// Helper to format product data into the structure expected by components
const formatProduct = (product) => {
    if (!product) return null;
    
    return {
        ...product,
        image: product.image || product.images?.[0]?.url,
        variants: (product.variants || []).map(variant => ({
            ...variant,
            price_formatted: formatCurrency(variant.price_in_cents),
            sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
            currency_info: { code: 'USD', symbol: '$', template: '$1' },
        }))
    };
};

// Fetch all products with their variants
export const getProducts = async () => {
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('purchasable', true);

    if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error('Failed to load products.');
    }
    
    return { products: (productsData || []).map(formatProduct) };
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
    const { error: deleteError } = await supabase
        .from('variants')
        .delete()
        .eq('product_id', productId)
        .not('id', 'in', `(${variantIdsToKeep.join(',')})`);
        
    if (deleteError) console.error("Error deleting old variants:", deleteError);
};

export const deleteProduct = async (productId) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
    
    if (error) throw error;
};

// ===== Order Management (Admin) =====

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

// ===== Customer Management (Admin) =====

export const getCustomersWithStats = async () => {
    // This uses an RPC function in Supabase for better performance.
    // You need to create this function in your Supabase SQL editor.
    const { data, error } = await supabase.rpc('get_customer_stats');

    if (error) {
        console.error("Error fetching customer stats:", error);
        // Fallback to client-side calculation if RPC fails or doesn't exist
        console.warn("Falling back to client-side customer stat calculation. For better performance, create the 'get_customer_stats' RPC function in Supabase.");
        
        const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
        if(profileError) throw profileError;
        
        const { data: orders, error: orderError } = await supabase.from('orders').select('user_id, total');
        if(orderError) throw orderError;
        
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
            total_spent: statsMap[profile.id]?.totalSpent || 0,
            order_count: statsMap[profile.id]?.orderCount || 0,
        }));
    }
    
    return data;
}

// NOTE: You must add the following SQL function to your Supabase project
// via the SQL Editor for the `getCustomersWithStats` function to work optimally.
/*
  CREATE OR REPLACE FUNCTION get_customer_stats()
  RETURNS TABLE(id uuid, email text, role text, created_at timestamptz, total_spent bigint, order_count bigint)
  LANGUAGE sql
  AS $$
    SELECT
      p.id,
      p.email,
      p.role,
      p.created_at,
      COALESCE(SUM(o.total), 0)::bigint AS total_spent,
      COALESCE(COUNT(o.id), 0)::bigint AS order_count
    FROM
      profiles p
    LEFT JOIN
      orders o ON p.id = o.user_id
    GROUP BY
      p.id;
  $$;
*/
