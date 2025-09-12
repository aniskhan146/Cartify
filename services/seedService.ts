import { ref, get, set, push } from 'firebase/database';
import { db } from './firebase';
import type { Product, Variant, VariantOption } from '../types';

// The category data stored in DB has a different shape than the UI one
interface DbCategory {
    name: string;
    iconUrl: string;
    productCount: number;
}

const sampleCategories: Omit<DbCategory, 'id'>[] = [
    { name: 'Electronics', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjIiIHk9IjciIHdpZHRoPSIyMCIgaGVpZHRoPSIxMyIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PHBhdGggZD0iTTEyIDE4VjdsLTMgM2g2bC0zLTMiPjwvcGF0aD48cGF0aCBkPSJNMjEgMTNoMjAiPjwvcGF0aD48L3N2Zz4=', productCount: 5 },
    { name: 'Fashion', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC4yOCAxNS4zNGwtNC4yOCA0LjI4YTIgMiAwIDAgMS0yLjgzIDBsLTQuMjgtNC4yOGEyIDIgMCAwIDEgMC0yLjgzbDQuMjgtNC4yOGEyIDIgMCAwIDEgMi44MyAwbDQuMjggNC4yOGEyIDIgMCAwIDEgMCAyLjgzek04LjUgMTcuNWwtNC00TTIxLjUgMTAuNWwtNCA0TTEyIDIxLjVWMTlNMTIgN1YyLjUiPjwvcGF0aD48L3N2Zz4=', productCount: 0 },
    { name: 'Home & Garden', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yIDIyaDIwTTIgMTRoMjBNMyAxNHYtNWEyIDIgMCAwIDEgMi0yaDE0YTIgMiAwIDAgMSAyIDJ2NU0xMiAxNFY3TTcgMTRWN00xNyAxNFY3TTEyIDRhMiAyIDAgMCAwLTIgMnYxaDRWNgeyI+PC9wYXRoPjwvc3ZnPg==', productCount: 0 },
    { name: 'Sports', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48cGF0aCBkPSJNMTIgMmExMCAxMCAwIDAgMC0xMCAxMGMwIDQuNDIgMi44NyA4LjE3IDYuODQgOS41Yy41LjA4Ljg2LS4zOC44Ni0uODV2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjh2LTIuMWMwLS40NC0uMzYtLjgtLjgtLjhINy41Yy0uMyAwLS41NC0uMjItLjU0LS41cy4yNC0uNS41NC0uNUg5LjVjLjQ0IDAgLjgtLjM2LjgtLjhWN S41YzAtLjQ3LjM4LS44NS44Ni0uODVjMy45NyAxLjMzIDYuODQgNS4wOCA2Ljg0IDkuNWExMCAxMCAwIDAgMC0xMC0xMHoiPjwvcGF0aD48L3N2Zz4=', productCount: 0 },
    { name: 'Books', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00IDE5LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDE3SDIwdiJINGuNUEyLjUgMi41IDAgMCAxIDQgMTkuNXpNNCA3LjVB franchisinguNSAyLjUgMCAwIDEgNi41IDVIMjB2Mkg2LjVB franchisinguNSAyLjUgMCAwIDEgNCA3LjV6TTQgMTMuNUEyLjUgMi41IDAgMCAxIDYuNSAxMUgyMHYySDYuNUEyLjUgMi41IDAgMCAxIDQgMTMuNXoiPjwvcGF0aD48L3N2Zz4=', productCount: 0 },
    { name: 'Toys', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDggNmg4bC00LTR6TTEyIDIybDQtNEg4bDQgNHpNNiA4bC00IDRoMjBsLTQtNHpNMTggMTZsNC00SDJsNCA0Ij48L3BhdGg+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiI+PC9jaXJjbGU+PC9zdmc+', productCount: 0 },
    { name: 'Health', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMC44NCA0LjYxYTUuNSA1LjUgMCAwIDAtNy43OCAwTDEyIDUuNjdsLTEuMDYtMS4wNmE1LjUgNS41IDAgMCAwLTcuNzggNy43OGwxLjA2IDEuMDZMMSAyMS4yM2w3Ljc4LTcuNzggMS4wNi0xLjA2YTUuNSA1LjUgMCAwIDAgMC03Ljc4eiI+PC9wYXRoPjwvc3ZnPg==', productCount: 0 },
    { name: 'Gifts', iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZHRoPSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwb2x5bGluZSBwb2ludHM9IjIwIDEyIDIwIDIyIDQgMjIgNCAxMiI+PC9wb2x5bGluZT48cmVjdCB4PSIyIiB5PSI3IiB3aWR0aD0iMjAiIGhlaWdodD0iNSI+PC9yZWN0PjxsaW5lIHgxPSIxMiIgeTE9IjIyIiB4Mj0iMTIiIHkyPSI3Ij48L2xpbmU+PHBhdGggZD0iTTEyIDdINy41YTIuNSAyLjUgMCAwIDEgMC01QzExIDIgMTIgNyAxMiA3ek0xMiA3aDQuNWEyLjUgMi41IDAgMCAwIDAtNUMxMyAyIDEyIDcgMTIgN3oiPjwvcGF0aD48L3N2Zz4=', productCount: 0 },
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
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'HDP-BLK', name: 'Color: Midnight Black', options: { 'Color': 'Midnight Black' }, price: 8500, originalPrice: 10000, stock: 75 },
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'HDP-WHT', name: 'Color: Arctic White', options: { 'Color': 'Arctic White' }, price: 8500, originalPrice: 10000, stock: 60 },
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'HDP-BLU', name: 'Color: Navy Blue', options: { 'Color': 'Navy Blue' }, price: 8700, stock: 40 },
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
            // FIX: The 'Variant' type requires an 'options' property. Added an empty object for standard variants.
            { id: 'AC4K-STD', name: 'Standard', options: {}, price: 15000, stock: 50 }
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
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'SFW-42-GRY', name: 'Size: 42mm, Color: Space Gray', options: { 'Size': '42mm', 'Color': 'Space Gray' }, price: 12000, originalPrice: 13500, stock: 120 },
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'SFW-42-SLV', name: 'Size: 42mm, Color: Silver', options: { 'Size': '42mm', 'Color': 'Silver' }, price: 12000, originalPrice: 13500, stock: 100 },
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'SFW-46-GRY', name: 'Size: 46mm, Color: Space Gray', options: { 'Size': '46mm', 'Color': 'Space Gray' }, price: 14000, originalPrice: 15500, stock: 80 },
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
            // FIX: The 'Variant' type requires an 'options' property. Added an empty object for standard variants.
            { id: 'EGM-RGB', name: 'Standard', options: {}, price: 4500, stock: 90 },
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
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'SHS-CHR', name: 'Color: Charcoal', options: { 'Color': 'Charcoal' }, price: 7000, stock: 60 },
            // FIX: The 'Variant' type requires an 'options' property. Added options based on the variant name.
            { id: 'SHS-WHT', name: 'Color: Chalk', options: { 'Color': 'Chalk' }, price: 7000, stock: 0 },
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
    if (sessionStorage.getItem('db_seeded')) {
        return;
    }

    try {
        // Check for products and seed if necessary
        const productsRef = ref(db, 'products');
        const productsSnapshot = await get(productsRef);
        if (!productsSnapshot.exists() || Object.keys(productsSnapshot.val()).length === 0) {
            console.log("No products found, adding example products...");
            const productUpdates: { [key: string]: any } = {};
            sampleProducts.forEach(prod => {
                const newKey = push(productsRef).key;
                if(newKey) {
                    productUpdates[newKey] = prod;
                }
            });
            await set(productsRef, productUpdates);
            console.log("Added example products.");
        }

        // Check for categories and seed if necessary (independent of products)
        const categoriesRef = ref(db, 'categories');
        const categoriesSnapshot = await get(categoriesRef);
        if (!categoriesSnapshot.exists() || Object.keys(categoriesSnapshot.val()).length === 0) {
             console.log("No categories found, seeding database...");
            const updates: { [key: string]: any } = {};
            sampleCategories.forEach(cat => {
                const newKey = push(categoriesRef).key;
                if(newKey) {
                    updates[newKey] = cat;
                }
            });
            await set(categoriesRef, updates);
            console.log("Seeded categories.");
        }

        // Check for variant options and seed if necessary
        const variantOptionsRef = ref(db, 'variantOptions');
        const variantOptionsSnapshot = await get(variantOptionsRef);
        if (!variantOptionsSnapshot.exists() || Object.keys(variantOptionsSnapshot.val()).length === 0) {
            console.log("No variant options found, adding examples...");
            const updates: { [key: string]: any } = {};
            sampleVariantOptions.forEach(opt => {
                const newKey = push(variantOptionsRef).key;
                if (newKey) {
                    updates[newKey] = opt;
                }
            });
            await set(variantOptionsRef, updates);
            console.log("Added example variant options.");
        }
        
        // Only log this if neither seeding process was needed.
        if (productsSnapshot.exists() && categoriesSnapshot.exists()) {
             console.log("Database already contains data, skipping seed.");
        }
        
        sessionStorage.setItem('db_seeded', 'true');
    } catch (error) {
        console.error("Database seeding failed:", error);
    }
};