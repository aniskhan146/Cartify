import React from 'react';
import type { Category } from '../../types';
import { StarIcon } from '../shared/icons';
import type { Filters } from './AllProductsPage'; // Import from AllProductsPage
import { formatCurrency } from '../shared/utils';

interface FilterSidebarProps {
  categories: Category[];
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
  onClearFilters: () => void;
  maxPrice: number;
}

const RatingFilter: React.FC<{ currentRating: number; onRatingChange: (rating: number) => void }> = ({ currentRating, onRatingChange }) => {
    return (
        <div className="space-y-2">
            {[4, 3, 2, 1].map(star => (
                <button
                    key={star}
                    onClick={() => onRatingChange(currentRating === star ? 0 : star)}
                    className={`w-full flex items-center justify-between text-left p-2 rounded-md text-sm transition-colors ${currentRating === star ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} className={`h-4 w-4 ${i < star ? 'text-yellow-400' : 'text-gray-500'}`} />
                        ))}
                    </div>
                    <span>&amp; Up</span>
                </button>
            ))}
        </div>
    );
};


const FilterSidebar: React.FC<FilterSidebarProps> = ({ categories, filters, onFilterChange, onClearFilters, maxPrice }) => {
  const handleCategoryChange = (categoryName: string) => {
    const newCategories = filters.categories.includes(categoryName)
      ? filters.categories.filter(c => c !== categoryName)
      : [...filters.categories, categoryName];
    onFilterChange({ categories: newCategories });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ priceRange: [0, Number(e.target.value)] });
  };

  const handleRatingChange = (rating: number) => {
    onFilterChange({ rating });
  };
  
  const handleStockStatusChange = (status: Filters['stockStatus']) => {
    onFilterChange({ stockStatus: status });
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 bg-card p-4 rounded-lg shadow-lg h-fit border border-border">
      <div className="flex justify-between items-center border-b border-border pb-3 mb-3">
        <h2 className="text-lg font-bold text-foreground">Filters</h2>
        <button onClick={onClearFilters} className="text-sm font-medium text-primary hover:underline">
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {/* Category Filter */}
        <div>
          <h3 className="font-semibold mb-2 text-foreground">Category</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.name)}
                  onChange={() => handleCategoryChange(category.name)}
                  className="h-4 w-4 rounded bg-secondary border-input text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground hover:text-foreground">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Stock Status Filter */}
        <div>
          <h3 className="font-semibold mb-2 text-foreground">Availability</h3>
          <div className="space-y-2">
            {(['all', 'inStock', 'outOfStock'] as const).map(status => (
                <label key={status} className="flex items-center space-x-3 cursor-pointer">
                    <input
                        type="radio"
                        name="stockStatus"
                        value={status}
                        checked={filters.stockStatus === status}
                        onChange={() => handleStockStatusChange(status)}
                        className="h-4 w-4 bg-secondary border-input text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground hover:text-foreground">
                        {status === 'all' ? 'All' : status === 'inStock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h3 className="font-semibold mb-2 text-foreground">Price Range</h3>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={filters.priceRange[1]}
              onChange={handlePriceChange}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              {/* FIX: Use the imported 'formatCurrency' utility to display price values. */}
              <span>{formatCurrency(0)}</span>
              {/* FIX: Use the imported 'formatCurrency' utility to display price values. */}
              <span>{formatCurrency(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <h3 className="font-semibold mb-2 text-foreground">Average Rating</h3>
           <RatingFilter currentRating={filters.rating} onRatingChange={handleRatingChange} />
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;