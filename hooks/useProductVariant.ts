import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, Variant } from '../types';

export const useProductVariant = (product: Product) => {
    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [quantity, setQuantity] = useState(1);

    const optionTypes = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return [];
        return Object.keys(product.variants[0].options || {});
    }, [product.variants]);

    const availableOptions = useMemo(() => {
        const options: { [key: string]: string[] } = {};
        const variants = product.variants || [];
        optionTypes.forEach(type => {
            options[type] = [...new Set(variants.map(v => v.options[type]).filter(Boolean))];
        });
        return options;
    }, [product.variants, optionTypes]);

    const isOptionAvailable = useCallback((type: string, value: string): boolean => {
        const tempSelection = { ...selectedOptions };
        delete tempSelection[type];
        
        return (product.variants || []).some(variant => 
             variant.options[type] === value &&
             Object.entries(tempSelection).every(([otherType, otherValue]) => variant.options[otherType] === otherValue)
        );
    }, [product.variants, selectedOptions]);
    
    useEffect(() => {
        const variants = product.variants || [];
        const firstAvailableVariant = variants.find(v => v.stock > 0) || variants[0];
        if (firstAvailableVariant) {
            setSelectedOptions(firstAvailableVariant.options || {});
        }
    }, [product]);

    useEffect(() => {
        const variants = product.variants || [];
        const allOptionsSelected = optionTypes.every(type => selectedOptions[type]);

        if (allOptionsSelected) {
            const foundVariant = variants.find(v => 
                optionTypes.every(type => (v.options || {})[type] === selectedOptions[type])
            );
            setSelectedVariant(foundVariant || null);
        } else {
            setSelectedVariant(null);
        }
        setQuantity(1);
    }, [selectedOptions, product.variants, optionTypes]);

    const handleOptionSelect = (type: string, value: string) => {
        setSelectedOptions(prev => {
            const newSelection = { ...prev, [type]: value };
            
            optionTypes.forEach(otherType => {
                if (otherType !== type && newSelection[otherType]) {
                    const tempSelection = { ...newSelection };
                    delete tempSelection[otherType];
                    const isStillValid = (product.variants || []).some(variant => 
                        variant.options[otherType] === newSelection[otherType] &&
                        Object.entries(tempSelection).every(([key, val]) => variant.options[key] === val)
                    );
                    if (!isStillValid) {
                        delete newSelection[otherType];
                    }
                }
            });
            return newSelection;
        });
    };

    const decreaseQuantity = () => setQuantity(q => Math.max(1, q - 1));
    const increaseQuantity = () => {
        if (selectedVariant) {
            setQuantity(q => Math.min(selectedVariant.stock, q + 1));
        }
    };
    
    const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
    const mainImage = selectedVariant?.imageUrl || product.imageUrls?.[0] || '';
    const currentPrice = selectedVariant?.price ?? product.variants?.[0]?.price ?? 0;
    const originalPrice = selectedVariant?.originalPrice;
    const currentStock = selectedVariant?.stock ?? 0;
    
    return {
        selectedOptions,
        selectedVariant,
        quantity,
        optionTypes,
        availableOptions,
        isOptionAvailable,
        handleOptionSelect,
        decreaseQuantity,
        increaseQuantity,
        isOutOfStock,
        mainImage,
        currentPrice,
        originalPrice,
        currentStock
    };
};