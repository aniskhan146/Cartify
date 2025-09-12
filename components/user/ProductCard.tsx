import React from 'react';
import type { Product } from '../../types';
import { ProductCardContent } from './ProductCardContent';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
    return (
        <div onClick={onClick} className="group relative w-full h-full cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md">
            <ProductCardContent product={product} />
        </div>
    );
};

export default ProductCard;
