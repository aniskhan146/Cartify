import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// Helper to format currency
export const formatCurrency = (amountInCents, currency = 'USD') => {
    const amount = (amountInCents || 0) / 100;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
