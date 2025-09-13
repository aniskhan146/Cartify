const RECENTLY_VIEWED_KEY = 'ayexpress_recently_viewed';
const MAX_RECENTLY_VIEWED = 5;

export const getRecentlyViewedProductIds = (): string[] => {
    try {
        const item = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return [];
    }
};

export const addProductToRecentlyViewed = (productId: string): void => {
    try {
        let ids = getRecentlyViewedProductIds();
        
        // Remove the id if it already exists to move it to the front
        ids = ids.filter(id => id !== productId);

        // Add the new id to the beginning
        ids.unshift(productId);

        // Ensure the list doesn't exceed the max size
        const trimmedIds = ids.slice(0, MAX_RECENTLY_VIEWED);

        window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(trimmedIds));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};