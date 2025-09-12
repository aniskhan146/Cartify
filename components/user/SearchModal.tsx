import React, { useState, useEffect, useMemo } from 'react';
import { SearchIcon, XIcon } from '../shared/icons';
import type { Product } from '../../types';
import { formatCurrency } from '../shared/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  onProductClick: (product: Product) => void;
}

const ProductListItem: React.FC<{ product: Product, onSelect: (product: Product) => void }> = ({ product, onSelect }) => (
    <li>
        <button onClick={() => onSelect(product)} className="w-full text-left flex items-center space-x-4 p-4 hover:bg-accent transition-colors">
            <img src={product.imageUrls?.[0] || ''} alt={product.name} className="w-16 h-16 rounded-md object-cover bg-muted" />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>
            {/* FIX: Property 'price' does not exist on type 'Product'. Display the price of the first variant. */}
            <p className="font-bold text-foreground">{formatCurrency(product.variants?.[0]?.price ?? 0)}</p>
        </button>
    </li>
);


const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, allProducts, onProductClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Delay clearing to prevent flicker during closing animation
      setTimeout(() => setSearchQuery(''), 300);
    }
  }, [isOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return allProducts.filter(product =>
      product.name.toLowerCase().includes(lowercasedQuery) ||
      product.category.toLowerCase().includes(lowercasedQuery) ||
      product.description.toLowerCase().includes(lowercasedQuery)
    ).slice(0, 8); // Limit results for performance
  }, [searchQuery, allProducts]);

  const popularProducts = useMemo(() => {
    return [...allProducts]
        .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
        .slice(0, 4); // Show top 4 popular products
  }, [allProducts]);

  if (!isOpen) {
    return null;
  }

  const handleProductSelect = (product: Product) => {
    onProductClick(product);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex justify-center items-start pt-20 modal-backdrop" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl relative border border-border modal-content" onClick={e => e.stopPropagation()}>
        <div className="relative p-2">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, categories, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="bg-transparent w-full pl-16 pr-12 py-4 text-lg focus:outline-none"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close search"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="border-t border-border max-h-[60vh] overflow-y-auto">
            {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                <ul>
                    {searchResults.map(product => (
                        <ProductListItem key={product.id} product={product} onSelect={handleProductSelect} />
                    ))}
                </ul>
                ) : (
                <div className="p-16 text-center text-muted-foreground">
                    <p>No results found for "{searchQuery}"</p>
                </div>
                )
            ) : (
                <div>
                    <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-muted-foreground">Popular Suggestions</h3>
                    <ul>
                        {popularProducts.map(product => (
                            <ProductListItem key={product.id} product={product} onSelect={handleProductSelect} />
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;