import { supabase } from './supabaseClient';
import type { Product, Variant, VariantOption } from '../types';
import { v4 as uuidv4 } from 'uuid';

// The category data stored in DB
interface DbCategory {
    id: string;
    name: string;
    iconUrl: string;
    productCount: number;
}

const sampleCategories: Omit<DbCategory, 'id' | 'productCount'>[] = [
    { name: 'Electronics', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjciIHdpZHRoPSIyMCIgaGVpZHRoPSIxMyIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PHBhdGggZD0iTTEyIDE4VjdsLTMgM2g2bC0zLTMiPjwvcGF0aD48cGF0aCBkPSJNMjEgMTNoMjAiPjwvcGF0aD48L3N2Zz4=' },
    { name: 'Fashion', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC4yOCAxNS4zNGwtNC4yOCA0LjI4YTIgMiAwIDAgMS0yLjgzIDBsLTQuMjgtNC4yOGEyIDIgMCAwIDEgMC0yLjgzbDQuMjgtNC4yOGEyIDIgMCAwIDEgMi44MyAwbDQuMjggNC4yOGEyIDIgMCAwIDEgMCAyLjgzek04LjUgMTcuNWwtNC00TTIxLjUgMTAuNWwtNCA0TTEyIDIxLjVWMTlNMTIgN1YyLjUiPjwvcGF0aD48L3N2Zz4=' },
    { name: 'Home & Garden', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yIDIyaDIwTTIgMTRoMjBNMyAxNHYtNWEyIDIgMCAwIDEgMi0yaDE0YTIgMiAwIDAgMSAyIDJ2NU0xMiAxNFY3TTcgMTRWN00xNyAxNFY3TTEyIDRhMiAyIDAgMCAwLTIgMnYxaDRWNgeyI+PC9wYXRoPjwvc3ZnPg==' },
    { name: 'Sports', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cGF0aCBkPSJNMTIgMmExMCAxMCAwIDAgMC0xMCAxMGMwIDQuNDIgMi44NyA4LjE3IDYuODQgOS41Yy41LjA4Ljg2LS4zOC44Ni0uODV2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjh2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjhWN S41YzAtLjQ3LjM4LS44NS44Ni0uODVjMy45NyAxLjMzIDYuODQgNS4wOCA2Ljg0IDkuNWExMCAxMCAwIDAgMC0xMC0xMHoiPjwvcGF0aD48L3N2Zz4=' },
    { name: 'Books', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00IDE5LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDE3SDIwdiJINGuNUEyLjUgMi41IDAgMCAxIDQgMTkuNXpNNCA3LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDVIMjB2Mkg2LjVB franchisinguNSAyLjUgMCAwIDEgNCA3LjV6TTQgMTMuNUEyLjUgMi41IDAgMCAxIDYuNSAxMUgyMHYySDYuNUEyLjUgMi41IDAgMCAxIDQgMTMuNXoiPjwvcGF0aD48L3N2Zz4=' },
    { name: 'Toys', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDggNmg4bC00LTR6TTEyIDIybDQtNEg4bDQgNHpNNiA4bC00IDRoMjBsLTQtNHpNMTggMTZsNC00SDJsNCA0Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiI+PC9jaXJjbGU+PC9zdmc+' },
    { name: 'Health', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC44NCA0LjYxYTUuNSA1LjUgMCAwIDAtNy43OCAwTDEyIDUuNjdsLTEuMDYtMS4wNmE1LjUgNS41IDAgMCAwLTcuNzggNy43OGwxLjA2IDEuMDZMMSAyMS4yM2w3Ljc4LTcuNzggMS4wNi0xLjA2YTUuNSA1LjUgMCAwIDAgMC03Ljc4eiI+PC9wYXRoPjwvc3ZnPg==' },
    { name: 'Gifts', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDEyIDIwIDIyIDQgMjIgNCAxMiI+PC9wb2x5bGluZT48cmVjdCB4PSIyIiB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iNSI+PC9yZWN0PjxsaW5lIHgxPSIxMiIgeTE9IjIyIiB4Mj0iMTIiIHkyPSI3Ij48L2xpbmU+PHBhdGggZD0iTTEyIDdINy41YTIuNSAyLjUgMCAwIDEgMC01QzExIDIgMTIgNyAxMiA3ek0xMiA3aDQuNWEyLjUgMi41IDAgMCAwIDAtNUMxMyAyIDEyIDcgMTIgN3oiPjwvcGF0aD48L3N2Zz4=' },
];

const sampleProducts: Omit<Product, 'id'>[] = [
    {
        name: "Pro Wireless Headphones",
        category: "Electronics",
        description: "Experience immersive sound with these state-of-the-art wireless headphones. Featuring active noise cancellation, a 24-hour battery life, and crystal-clear microphone quality. Perfect for music, calls, and gaming.",
        imageUrls: ['https://picsum.photos/seed/headphones/400/300', 'https://picsum.photos/seed/headphones2/400/300'],
        rating: 4.8,
        reviews: 1250,
        deliveryTimescale: "Ships in 2-4 business days",
        variants: [
            { id: uuidv4(), name: 'Color: Midnight Black', options: { 'Color': 'Midnight Black' }, price: 8500, originalPrice: 10000, stock: 75 },
            { id: uuidv4(), name: 'Color: Arctic White', options: { 'Color': 'Arctic White' }, price: 8500, originalPrice: 10000, stock: 60 },
            { id: uuidv4(), name: 'Color: Navy Blue', options: { 'Color': 'Navy Blue' }, price: 8700, stock: 40 },
        ]
    },
    {
        name: "4K Action Camera",
        category: "Electronics",
        description: "Capture your adventures in stunning 4K. This rugged, waterproof action camera is built for the extreme, with image stabilization and a wide-angle lens.",
        imageUrls: ['https://picsum.photos/seed/camera/400/300', 'https://picsum.photos/seed/camera2/400/300'],
        rating: 4.6,
        reviews: 890,
        deliveryTimescale: "Ships in 1-3 business days",
        variants: [
            { id: uuidv4(), name: 'Standard', options: {}, price: 15000, stock: 50 }
        ]
    },
    {
        name: "Smart Fitness Watch",
        category: "Electronics",
        description: "Track your fitness goals with this sleek smartwatch. Monitors heart rate, sleep patterns, and daily activity, with a vibrant AMOLED display and long-lasting battery.",
        imageUrls: ['https://picsum.photos/seed/watch/400/300', 'https://picsum.photos/seed/watch2/400/300'],
        rating: 4.7,
        reviews: 1500,
        variants: [
            { id: uuidv4(), name: 'Size: 42mm / Color: Space Gray', options: { 'Size': '42mm', 'Color': 'Space Gray' }, price: 12000, originalPrice: 13500, stock: 120 },
            { id: uuidv4(), name: 'Size: 42mm / Color: Silver', options: { 'Size': '42mm', 'Color': 'Silver' }, price: 12000, originalPrice: 13500, stock: 100 },
            { id: uuidv4(), name: 'Size: 46mm / Color: Space Gray', options: { 'Size': '46mm', 'Color': 'Space Gray' }, price: 14000, originalPrice: 15500, stock: 80 },
        ]
    },
    {
        name: "Ergonomic Gaming Mouse",
        category: "Electronics",
        description: "Gain a competitive edge with this high-precision ergonomic gaming mouse. Features customizable RGB lighting, programmable buttons, and an ultra-responsive sensor.",
        imageUrls: ['https://picsum.photos/seed/mouse/400/300', 'https://picsum.photos/seed/mouse2/400/300'],
        rating: 4.9,
        reviews: 2100,
        variants: [
            { id: uuidv4(), name: 'Standard', options: {}, price: 4500, stock: 90 },
        ]
    },
    {
        name: "Smart Home Speaker",
        category: "Electronics",
        description: "Control your smart home with your voice. This smart speaker delivers rich, room-filling sound and connects seamlessly with your favorite smart devices and music services.",
        imageUrls: ['https://picsum.photos/seed/speaker/400/300', 'https://picsum.photos/seed/speaker2/400/300'],
        rating: 4.5,
        reviews: 750,
        deliveryTimescale: "Ships in 3-5 business days",
        variants: [
            { id: uuidv4(), name: 'Color: Charcoal', options: { 'Color': 'Charcoal' }, price: 7000, stock: 60 },
            { id: uuidv4(), name: 'Color: Chalk', options: { 'Color': 'Chalk' }, price: 7000, stock: 0 },
        ]
    },
];

const sampleVariantOptions: Omit<VariantOption, 'id'>[] = [
    {
        name: "Color",
        values: [
            { name: 'Midnight Black', colorCode: '#1C1C1E' },
            { name: 'Starlight', colorCode: '#F0EBE0' },
            { name: 'Sierra Blue', colorCode: '#A7C7E7' },
            { name: 'Product Red', colorCode: '#BF0A30' },
            { name: 'Alpine Green', colorCode: '#587464' },
            { name: 'Rose Gold', colorCode: '#B76E79' },
        ]
    },
    {
        name: "Size",
        values: [
            { name: 'Small' },
            { name: 'Medium' },
            { name: 'Large' },
            { name: 'XL' },
            { name: 'XXL' },
        ]
    },
    {
        name: "Storage",
        values: [
            { name: '64GB' },
            { name: '128GB' },
            { name: '256GB' },
            { name: '512GB' },
        ]
    }
];


export const seedDatabaseIfNeeded = async () => {
    // Use a flag in sessionStorage to ensure seeding only happens once per session
    if (sessionStorage.getItem('db_seeded_supabase')) {
        return;
    }

    try {
        // Check for products
        const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (productCount === 0) {
            console.log("No products found, adding example products...");
            const productsToInsert = sampleProducts.map(p => ({ ...p, id: uuidv4() }));
            const { error } = await supabase.from('products').upsert(productsToInsert);
            if (error) throw error;
            console.log("Added example products.");
        }

        // Check for categories
        const { count: categoryCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        if (categoryCount === 0) {
             console.log("No categories found, seeding database...");
             const categoriesToInsert = sampleCategories.map((cat, i) => ({
                id: uuidv4(),
                name: cat.name,
                iconUrl: cat.iconUrl,
                productCount: cat.name === 'Electronics' ? 5 : 0
             }));
            const { error } = await supabase.from('categories').upsert(categoriesToInsert);
            if (error) throw error;
            console.log("Seeded categories.");
        }

        // Check for variant options
        const { count: variantOptionCount } = await supabase.from('variant_options').select('*', { count: 'exact', head: true });
        if (variantOptionCount === 0) {
            console.log("No variant options found, adding examples...");
            const optionsToInsert = sampleVariantOptions.map(opt => ({ ...opt, id: uuidv4() }));
            const { error } = await supabase.from('variant_options').upsert(optionsToInsert);
            if (error) throw error;
            console.log("Added example variant options.");
        }

        // Check for storefront settings
        const { data: settings } = await supabase.from('storefront_settings').select('*').eq('id', 1).single();
        if (!settings) {
            console.log("No storefront settings found, adding defaults...");
            const { error } = await supabase.from('storefront_settings').upsert({
                id: 1,
                hero_images: [],
                checkout_config: { shippingChargeInsideDhaka: 60, shippingChargeOutsideDhaka: 120, taxAmount: 4 }
            });
            if (error) throw error;
            console.log("Added default storefront settings.");
        }
        
        console.log("Database already contains data or has been seeded.");
        sessionStorage.setItem('db_seeded_supabase', 'true');
    } catch (error) {
        console.error("Database seeding failed:", error);
    }
};