import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

// Fetch all products with their variants
export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('purchasable', true);

    if (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to load products.');
    }
    
    // The component expects a specific structure
    return { products: data.map(formatProduct) };
};

// Fetch a single product by its ID
export const getProduct = async (id) => {
    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        throw new Error('Product not found.');
    }
    
    return formatProduct(data);
};

// Fetch quantities for product variants
export const getProductQuantities = async ({ fields, product_ids }) => {
    const { data, error } = await supabase
        .from('variants')
        .select(`id, ${fields}`)
        .in('product_id', product_ids);
    
    if (error) {
        console.error('Error fetching product quantities:', error);
        throw new Error('Failed to load product quantities.');
    }

    return { variants: data };
};

// Helper to format product data into the structure expected by components
const formatProduct = (product) => {
    if (!product) return null;
    
    return {
        ...product,
        image: product.image || product.images?.[0]?.url,
        variants: product.variants.map(variant => ({
            ...variant,
            price_formatted: formatCurrency(variant.price_in_cents),
            sale_price_formatted: variant.sale_price_in_cents ? formatCurrency(variant.sale_price_in_cents) : null,
            currency_info: { code: 'USD', symbol: '$', template: '$1' },
        }))
    };
};
