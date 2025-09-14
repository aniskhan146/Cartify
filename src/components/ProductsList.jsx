import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductCardSkeleton = () => (
    <div className="group animate-pulse">
        <div className="glass-effect rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="relative overflow-hidden h-48 bg-slate-700/50" />
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-1">
                    <div className="h-4 w-1/4 bg-slate-700/50 rounded" />
                    <div className="h-4 w-1/6 bg-slate-700/50 rounded" />
                </div>
                <div className="h-5 w-3/4 bg-slate-700/50 rounded my-2 flex-grow" />
                <div className="flex items-center justify-between mt-auto">
                    <div className="h-7 w-1/3 bg-slate-700/50 rounded" />
                    <div className="h-8 w-8 bg-slate-700/50 rounded-full" />
                </div>
            </div>
        </div>
    </div>
);

const ProductsList = ({ products, loading, error, skeletonCount = 8 }) => {

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(skeletonCount)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-8">
        <p>Error loading products: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center text-gray-400 p-8 glass-effect rounded-2xl">
        <h3 className="text-2xl font-bold text-white mb-2">No Products Found</h3>
        <p>Try adjusting your filters or check back later!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductsList;