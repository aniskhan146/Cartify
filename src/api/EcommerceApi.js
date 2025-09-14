import { supabase } from '../lib/supabase.js';
import { formatCurrency } from '../lib/utils.js';

// =================================================================
// IMPORTANT: DATABASE SCHEMA SETUP
// =================================================================
// You MUST run the following SQL in your Supabase SQL Editor for the
// new features (Brands, Categories, SKUs, etc.) to work correctly.

/*
-- 1. Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    logo_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to brands" ON public.brands;
CREATE POLICY "Allow public read access to brands" ON public.brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access to brands" ON public.brands;
CREATE POLICY "Allow admin full access to brands" ON public.brands FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin') WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

-- 2. Categories Table (with self-referencing for nesting)
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access to categories" ON public.categories;
CREATE POLICY "Allow admin full access to categories" ON public.categories FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin') WITH CHECK (auth.jwt() ->> 'user_role' = 'admin');

-- 3. Products Table Modifications
-- First, remove the old text-based 'category' column
ALTER TABLE public.products DROP COLUMN IF EXISTS category;
-- Add new foreign key columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id bigint REFERENCES public.brands(id) ON DELETE SET NULL;
-- Add specifications column to store product details
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications jsonb;


-- 4. Variants Table Modifications
-- Add SKU for unique product tracking and color hex for color picker
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS sku text UNIQUE;
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS color_hex text;

-- 5. Cart Items Table
CREATE TABLE IF NOT EXISTS public.cart_items (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id bigint NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, variant_id)
);
-- Ensure RLS is enabled and policies are set for the cart
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own cart items" ON public.cart_items;
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. Inventory Decrease Function
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

-- 7. Customer Stats Function
CREATE OR REPLACE FUNCTION get_customer_stats()
RETURNS TABLE(id uuid, email text, role text, created_at timestamptz, total_spent bigint, order_count bigint)
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

-- 8. Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist" ON public.wishlist FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Add Payment Method to Orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'card';


*/

// =================================================================
// API Implementation
// =================================================================


const MAX_PRICE_CENTS = 500000; // Corresponds to StorePage constant

const transformSupabaseImage = (url, width, height) => {
    if (!url || !url.includes('/storage/v1/object/public/')) return url;
    const transformedUrl = url.replace('/object/public/', '/render/image/public/');
    return `${transformedUrl}?width=${width}&height=${height}&resize=cover`;
};

const formatProduct = (product) => {
    if (!product) return null;
    const mainImage = product.image || product.images?.[0]?.url;
    return {
        ...product,
        image: transformSupabaseImage(mainImage, 500, 500),
        galleryImages: (product.images?.map(img => img.url) || []),
        variants: (product.variants || []).map(variant => ({
            ...variant,
            price_formatted: formatCurrency(variant.price_in_cents),
            sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
        }))
    };
};

export const getProducts = async ({ page = 1, limit = 8, categoryIds = null, searchTerm = '', sortBy = 'name', priceRange = [0, MAX_PRICE_CENTS] }) => {
    const offset = (page - 1) * limit;

    let productIdsFromPriceFilter = null;
    if (priceRange[0] > 0 || priceRange[1] < MAX_PRICE_CENTS) {
        const { data: variantData, error: variantError } = await supabase
            .from('variants')
            .select('product_id')
            .gte('price_in_cents', priceRange[0])
            .lte('price_in_cents', priceRange[1]);
        if (variantError) throw new Error('Failed to filter by price.');
        productIdsFromPriceFilter = [...new Set(variantData.map(v => v.product_id))];
        if (productIdsFromPriceFilter.length === 0) return { products: [], count: 0 };
    }

    let query = supabase
        .from('products')
        .select('*, variants(*), categories(name), brands(name)', { count: 'exact' })
        .eq('purchasable', true);

    if (categoryIds && categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
    }
    
    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }
    if (productIdsFromPriceFilter) {
        query = query.in('id', productIdsFromPriceFilter);
    }
    if (sortBy === 'name') {
        query = query.order('title', { ascending: true });
    }

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

export const getProduct = async (id) => {
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, variants(*), categories(name), brands(name)')
        .eq('id', id)
        .single();
    if (productError) {
        console.error('Error fetching product:', productError);
        throw new Error('Product not found.');
    }
    return formatProduct(productData);
};

export const getRelatedProducts = async (productId, categoryId) => {
    if (!categoryId) return [];
    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('category_id', categoryId)
        .neq('id', productId)
        .eq('purchasable', true)
        .limit(4);
    if (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
    return (data || []).map(formatProduct);
};

// ===== Product Management (Admin) =====

const generateSku = (productTitle, variantTitle) => {
    const titlePart = productTitle.substring(0, 4).toUpperCase();
    const variantPart = variantTitle.substring(0, 3).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AYX-${titlePart}-${variantPart}-${randomPart}`;
};

export const createProduct = async (productData, variantsData) => {
    const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
    if (productError) throw productError;

    const variantsWithSku = variantsData.map(v => ({ 
        ...v, 
        product_id: newProduct.id,
        sku: v.sku || generateSku(newProduct.title, v.title)
    }));
    const { error: variantsError } = await supabase.from('variants').insert(variantsWithSku);
    if (variantsError) {
        await supabase.from('products').delete().eq('id', newProduct.id);
        throw variantsError;
    }
    return { ...newProduct, variants: variantsWithSku };
};

export const updateProduct = async (productId, productData, variantsData) => {
    const { error: productError } = await supabase.from('products').update(productData).eq('id', productId);
    if (productError) throw productError;

    const variantsToUpsert = variantsData.map(v => ({
        ...(typeof v.id === 'number' && { id: v.id }),
        product_id: productId,
        title: v.title,
        price_in_cents: v.price_in_cents,
        sale_price_in_cents: v.sale_price_in_cents,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
        color_hex: v.color_hex,
        sku: v.sku || generateSku(productData.title, v.title),
    }));
    const { error: variantsError } = await supabase.from('variants').upsert(variantsToUpsert, { onConflict: 'id' });
    if (variantsError) throw variantsError;

    const variantIdsToKeep = variantsData.map(v => v.id).filter(Boolean);
    if (variantIdsToKeep.length > 0) {
        const { error: deleteError } = await supabase.from('variants').delete().eq('product_id', productId).not('id', 'in', `(${variantIdsToKeep.join(',')})`);
        if (deleteError) console.error("Error deleting old variants:", deleteError);
    } else {
        const { error: deleteAllError } = await supabase.from('variants').delete().eq('product_id', productId);
        if (deleteAllError) console.error("Error deleting all variants:", deleteAllError);
    }
};

export const deleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw error;
};


// ===== Category Management (Admin) =====

export const getCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .order('name');
    if (error) throw error;
    return data;
};
export const createCategory = async (categoryData) => {
    const { data, error } = await supabase.from('categories').insert(categoryData).select().single();
    if (error) throw error;
    return data;
};
export const updateCategory = async (id, categoryData) => {
    const { data, error } = await supabase.from('categories').update(categoryData).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteCategory = async (id) => {
    // Check for child categories first
    const { count, error: countError } = await supabase.from('categories').select('id', { count: 'exact' }).eq('parent_id', id);
    if (countError) throw countError;
    if (count > 0) throw new Error("Cannot delete category with sub-categories. Please reassign or delete them first.");
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
};

// ===== Brand Management (Admin) =====

export const getBrands = async () => {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw error;
    return data;
};
export const createBrand = async (brandData) => {
    const { data, error } = await supabase.from('brands').insert(brandData).select().single();
    if (error) throw error;
    return data;
};
export const updateBrand = async (id, brandData) => {
    const { data, error } = await supabase.from('brands').update(brandData).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteBrand = async (id) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) throw error;
};


// ===== Order Management (Admin & Checkout) =====

export const updateOrderStatus = async (orderId, newStatus) => {
    const { data, error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).select().single();
    if (error) throw error;
    return data;
};

export const getOrderDetails = async (orderId) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, variants(*, products(title, image)))')
        .eq('id', orderId)
        .single();
    if (error) {
        console.error('Error fetching order details:', error);
        throw new Error('Could not retrieve order details.');
    }
    return data;
};

export const decreaseInventory = async (orderId) => {
    const { error } = await supabase.rpc('decrease_inventory_for_order', { p_order_id: orderId });
    if (error) {
        console.error('Error decreasing inventory:', error);
        throw new Error('Failed to update product stock.');
    }
};


// ===== Customer Management (Admin) =====

export const getCustomersWithStats = async () => {
    const { data, error } = await supabase.rpc('get_customer_stats');
    if (error) {
        console.error("Error fetching customer stats via RPC:", error);
        if (error.code === '42P01' || error.message.includes('relation "public.profiles" does not exist')) {
             console.warn("RPC function failed because 'profiles' table is missing. Returning empty customer list.");
             return [];
        }
        return [];
    }
    return data;
}

// ===== Cart Management =====

export const getCartForUser = async (userId) => {
    const { data, error } = await supabase.from('cart_items').select('quantity, variants(*, products(*))').eq('user_id', userId);
    if (error) throw error;
    return data.map(item => {
        const product = item.variants.products;
        const variant = { ...item.variants, products: undefined };
        return {
            quantity: item.quantity,
            product: { id: product.id, title: product.title, image: transformSupabaseImage(product.image, 100, 100) },
            variant: { ...variant, price_formatted: formatCurrency(variant.price_in_cents), sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null }
        };
    });
};

export const addOrUpdateCartItem = async (userId, variantId, quantity) => {
    const { error: upsertError } = await supabase.from('cart_items').upsert({ user_id: userId, variant_id: variantId, quantity: quantity }, { onConflict: 'user_id,variant_id' });
    if (upsertError) throw upsertError;
    const { data, error: fetchError } = await supabase.from('cart_items').select('quantity, variants(*, products(*))').eq('user_id', userId).eq('variant_id', variantId).single();
    if (fetchError) throw fetchError;
    const product = data.variants.products;
    const variant = { ...data.variants, products: undefined };
    return {
        quantity: data.quantity,
        product: { id: product.id, title: product.title, image: transformSupabaseImage(product.image, 100, 100) },
        variant: { ...variant, price_formatted: formatCurrency(variant.price_in_cents), sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null }
    };
};

export const removeCartItem = async (userId, variantId) => {
    const { error } = await supabase.from('cart_items').delete().match({ user_id: userId, variant_id: variantId });
    if (error) throw error;
};

export const clearUserCart = async (userId) => {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) throw error;
};