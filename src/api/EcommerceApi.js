import { supabase } from '../lib/supabase.js';
import { formatCurrency } from '../lib/utils.js';

// =================================================================
// IMPORTANT: DATABASE SCHEMA SETUP
// =================================================================
// To set up the database, please run the SQL commands located in
// the `SQL.txt` file at the root of this project in your
// Supabase SQL Editor.
// =================================================================

// =================================================================
// API Implementation
// =================================================================


const MAX_PRICE_CENTS = 500000; // Corresponds to StorePage constant

const transformSupabaseImage = (url, width, height) => {
    if (!url || !url.includes('/storage/v1/object/public/')) return url;
    const transformedUrl = url.replace('/object/public/', '/render/image/public/');
    return `${transformedUrl}?width=${width}&height=${height}&resize=cover`;
};

const formatProduct = (product, imageWidth = 500, imageHeight = 500) => {
    if (!product) return null;
    const mainImage = product.image || product.images?.[0]?.url;
    return {
        ...product,
        image: transformSupabaseImage(mainImage, imageWidth, imageHeight),
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
        products: (productsData || []).map(p => formatProduct(p, 500, 500)),
        count: count || 0,
    };
};

export const getProduct = async (id) => {
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
            *,
            categories(name),
            brands(name),
            variants (
                *,
                variant_options (
                    option_value_id,
                    product_option_values (
                        value,
                        option_id,
                        product_options (name)
                    )
                )
            )
        `)
        .eq('id', id)
        .single();

    if (productError) {
        console.error('Error fetching product:', productError);
        throw new Error('Product not found.');
    }
    
    // Structure the data for easier use on the frontend
    const formattedProduct = formatProduct(productData, 800, 800);
    formattedProduct.options = [];
    const optionsMap = new Map();

    formattedProduct.variants.forEach(variant => {
        variant.options = [];
        variant.variant_options.forEach(vo => {
            const optionValue = vo.product_option_values;
            const option = optionValue.product_options;

            // Add to variant's direct options list
            variant.options.push({
                option_name: option.name,
                option_id: option.id,
                value: optionValue.value,
                value_id: optionValue.id
            });
            
            // Aggregate all available options for the product
            if (!optionsMap.has(option.id)) {
                optionsMap.set(option.id, {
                    id: option.id,
                    name: option.name,
                    values: new Map()
                });
            }
            if (!optionsMap.get(option.id).values.has(optionValue.id)) {
                 optionsMap.get(option.id).values.set(optionValue.id, {
                     id: optionValue.id,
                     value: optionValue.value
                 });
            }
        });
    });
    
    formattedProduct.options = Array.from(optionsMap.values()).map(opt => ({
        ...opt,
        values: Array.from(opt.values.values())
    }));


    return formattedProduct;
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
    return (data || []).map(p => formatProduct(p, 500, 500));
};

// ===== Product Management (Admin) =====

const generateSku = (productTitle, variantOptions) => {
    const titlePart = productTitle.substring(0, 3).toUpperCase();
    const variantPart = variantOptions.map(v => v.value.substring(0, 2)).join('').toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `AYX-${titlePart}-${variantPart}-${randomPart}`;
};

export const createProduct = async (productData, variantsData) => {
    // 1. Create the product
    const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
    if (productError) throw productError;

    // 2. Create the variants
    const variantsToInsert = variantsData.map(v => ({
        product_id: newProduct.id,
        price_in_cents: v.price_in_cents,
        sale_price_in_cents: v.sale_price_in_cents,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
        sku: v.sku || generateSku(newProduct.title, v.options),
    }));
    const { data: newVariants, error: variantsError } = await supabase
        .from('variants')
        .insert(variantsToInsert)
        .select();
    if (variantsError) {
        await supabase.from('products').delete().eq('id', newProduct.id); // Rollback
        throw variantsError;
    }
    
    // 3. Link variants to their option values
    const variantOptionsToInsert = [];
    newVariants.forEach((variant, index) => {
        variantsData[index].options.forEach(option => {
            variantOptionsToInsert.push({
                variant_id: variant.id,
                option_value_id: option.value_id
            });
        });
    });
    
    const { error: voError } = await supabase.from('variant_options').insert(variantOptionsToInsert);
    if (voError) {
        await supabase.from('products').delete().eq('id', newProduct.id); // Rollback
        throw voError;
    }

    return newProduct;
};

export const updateProduct = async (productId, productData, variantsData) => {
    // 1. Update product details
    const { error: productError } = await supabase.from('products').update(productData).eq('id', productId);
    if (productError) throw productError;
    
    const incomingVariantIds = variantsData.map(v => v.id).filter(id => typeof id === 'number');

    // 2. Delete variants that are no longer present
    const { error: deleteError } = await supabase
      .from('variants')
      .delete()
      .eq('product_id', productId)
      .not('id', 'in', `(${incomingVariantIds.length > 0 ? incomingVariantIds.join(',') : '0'})`);
    if (deleteError) console.error('Error deleting old variants:', deleteError);


    // 3. Upsert variants
    const variantsToUpsert = variantsData.map(v => ({
        id: typeof v.id === 'number' ? v.id : undefined,
        product_id: productId,
        price_in_cents: v.price_in_cents,
        sale_price_in_cents: v.sale_price_in_cents,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
        sku: v.sku || generateSku(productData.title, v.options),
    }));
    const { data: upsertedVariants, error: variantsError } = await supabase
        .from('variants')
        .upsert(variantsToUpsert)
        .select();
    if (variantsError) throw variantsError;
    
    // 4. Re-link variant options
    // Easier to delete all and re-insert than to calculate the diff
    const upsertedVariantIds = upsertedVariants.map(v => v.id);
    const { error: voDeleteError } = await supabase
      .from('variant_options')
      .delete()
      .in('variant_id', upsertedVariantIds);
    if (voDeleteError) throw voDeleteError;
      
    const variantOptionsToInsert = [];
    upsertedVariants.forEach(variant => {
        // Find corresponding variant from input data
        const originalVariant = variantsData.find(v => (v.id === variant.id) || (v.temp_id && upsertedVariants.length === variantsData.length));
        if (originalVariant) {
            originalVariant.options.forEach(option => {
                variantOptionsToInsert.push({
                    variant_id: variant.id,
                    option_value_id: option.value_id
                });
            });
        }
    });

    if(variantOptionsToInsert.length > 0) {
        const { error: voInsertError } = await supabase.from('variant_options').insert(variantOptionsToInsert);
        if (voInsertError) throw voInsertError;
    }
};


export const deleteProduct = async (productId) => {
    const { error } = await supabase
        .from('products')
        .update({ purchasable: false })
        .eq('id', productId);
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
    const { count: childCount, error: childError } = await supabase.from('categories').select('id', { count: 'exact' }).eq('parent_id', id);
    if (childError) throw childError;
    if (childCount > 0) throw new Error("Cannot delete category with sub-categories. Please reassign or delete them first.");
    const { count: productCount, error: productError } = await supabase.from('products').select('id', { count: 'exact' }).eq('category_id', id);
    if (productError) throw productError;
    if (productCount > 0) throw new Error(`Cannot delete category. It is in use by ${productCount} product(s).`);
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

// ===== Product Option Management (Admin) =====
export const getProductOptions = async () => {
    const { data, error } = await supabase
        .from('product_options')
        .select('*, product_option_values(*)')
        .order('name');
    if (error) throw error;
    return data;
};
export const upsertProductOption = async (optionName, optionValues) => {
    // 1. Upsert option name
    const { data: optionData, error: optionError } = await supabase
        .from('product_options')
        .upsert({ name: optionName }, { onConflict: 'name' })
        .select()
        .single();
    if (optionError) throw optionError;

    // 2. Upsert option values
    const valuesToUpsert = optionValues.map(v => ({
        id: typeof v.id === 'number' ? v.id : undefined,
        option_id: optionData.id,
        value: v.value
    }));
    const { error: valueError } = await supabase
        .from('product_option_values')
        .upsert(valuesToUpsert);
    if (valueError) throw valueError;

    // 3. Delete removed values
    const valueIdsToKeep = optionValues.map(v => v.id).filter(Boolean);
    if (valueIdsToKeep.length > 0) {
        const { error: deleteError } = await supabase
            .from('product_option_values')
            .delete()
            .eq('option_id', optionData.id)
            .not('id', 'in', `(${valueIdsToKeep.join(',')})`);
        if (deleteError) console.error("Error deleting old option values:", deleteError);
    } else if (optionValues.length === 0) {
        // If all values are removed, delete all for this option
        const { error: deleteAllError } = await supabase
            .from('product_option_values')
            .delete()
            .eq('option_id', optionData.id);
        if (deleteAllError) console.error("Error deleting all option values:", deleteAllError);
    }
    
    return optionData;
};
export const deleteProductOption = async (optionId) => {
    // on_delete: CASCADE will handle deleting associated values
    const { error } = await supabase.from('product_options').delete().eq('id', optionId);
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
        .select(`
            *, 
            profiles(email), 
            order_items(*, 
                variants(*, 
                    products(title, image),
                    variant_options(product_option_values(value, product_options(name)))
                )
            )
        `)
        .eq('id', orderId)
        .single();
    if (error) {
        console.error('Error fetching order details:', error);
        throw new Error('Could not retrieve order details.');
    }
    // Format variant titles for display
    data.order_items.forEach(item => {
        if(item.variants?.variant_options) {
             item.variants.title = item.variants.variant_options
                .map(vo => vo.product_option_values.value)
                .join(' / ');
        }
    });
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
        throw error;
    }
    return data;
}

export const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
    });
    if (error) throw error;
};

export const deleteUserByAdmin = async (userId) => {
    const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
    });
    if (error) throw error;
};

// ===== Sales Analytics (Admin) =====
export const getSalesSummary = async () => {
    const { data, error } = await supabase.rpc('get_sales_summary_for_ai');
    if (error) {
        console.error("Error fetching sales summary:", error);
        throw error;
    }
    return data?.[0]?.summary_data;
};


// ===== Cart Management =====

const formatCartItem = (item) => {
    const product = item.variants.products;
    const variantData = { ...item.variants, products: undefined };
    const variantTitle = variantData.variant_options
        .map(vo => vo.product_option_values.value)
        .join(' / ');

    return {
        quantity: item.quantity,
        product: { id: product.id, title: product.title, image: transformSupabaseImage(product.image, 100, 100) },
        variant: { 
            ...variantData,
            title: variantTitle,
            price_formatted: formatCurrency(variantData.price_in_cents), 
            sale_price_formatted: variantData.sale_price_in_cents ? formatCurrency(variantData.sale_price_in_cents) : null 
        }
    };
};

export const getCartForUser = async (userId) => {
    const { data, error } = await supabase
        .from('cart_items')
        .select(`
            quantity, 
            variants (
                *, 
                products(*),
                variant_options(product_option_values(value, product_options(name)))
            )
        `)
        .eq('user_id', userId);
    if (error) throw error;
    return data.map(formatCartItem);
};

export const addOrUpdateCartItem = async (userId, variantId, quantity) => {
    const { error: upsertError } = await supabase.from('cart_items').upsert({ user_id: userId, variant_id: variantId, quantity: quantity }, { onConflict: 'user_id,variant_id' });
    if (upsertError) throw upsertError;
    
    const { data, error: fetchError } = await supabase
        .from('cart_items')
        .select(`
            quantity, 
            variants (
                *, 
                products(*),
                variant_options(product_option_values(value, product_options(name)))
            )
        `)
        .eq('user_id', userId)
        .eq('variant_id', variantId)
        .single();
    if (fetchError) throw fetchError;
    return formatCartItem(data);
};

export const removeCartItem = async (userId, variantId) => {
    const { error } = await supabase.from('cart_items').delete().match({ user_id: userId, variant_id: variantId });
    if (error) throw error;
};

export const clearUserCart = async (userId) => {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);
    if (error) throw error;
};
