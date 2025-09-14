import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

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

// Fetch all products with their variants
export const getProducts = async () => {
    // 1. Fetch products
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('purchasable', true);

    if (productsError) {
        console.error('Error fetching products:', productsError);
        throw new Error('Failed to load products.');
    }
    
    if (!productsData || productsData.length === 0) {
        return { products: [] };
    }
    
    // 2. Fetch all variants for those products
    const productIds = productsData.map(p => p.id);
    const { data: variantsData, error: variantsError } = await supabase
        .from('variants')
        .select('*')
        .in('product_id', productIds);
        
    if (variantsError) {
        console.error('Error fetching variants:', variantsError);
        throw new Error('Failed to load product variants.');
    }
    
    // 3. Combine products and variants
    const variantsByProductId = variantsData.reduce((acc, variant) => {
        if (!acc[variant.product_id]) {
            acc[variant.product_id] = [];
        }
        acc[variant.product_id].push(variant);
        return acc;
    }, {});
    
    const combinedProducts = productsData.map(product => ({
        ...product,
        variants: variantsByProductId[product.id] || []
    }));

    return { products: combinedProducts.map(formatProduct) };
};

// Fetch a single product by its ID
export const getProduct = async (id) => {
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (productError) {
        console.error('Error fetching product:', productError);
        throw new Error('Product not found.');
    }

    const { data: variantsData, error: variantsError } = await supabase
        .from('variants')
        .select('*')
        .eq('product_id', id);
        
    if (variantsError) {
        console.error('Error fetching variants for product:', variantsError);
    }
    
    const combinedProduct = {
        ...productData,
        variants: variantsData || []
    };
    
    return formatProduct(combinedProduct);
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
