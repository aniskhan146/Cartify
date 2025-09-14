import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button.jsx';
import { useCart } from '../hooks/useCart.jsx';
import { useToast } from './ui/use-toast.js';

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.variants.length > 1) {
        navigate(`/product/${product.id}`);
        return;
    }
    
    const defaultVariant = product.variants[0];

    addToCart(product, defaultVariant, 1, defaultVariant.inventory_quantity)
        .then(() => {
            toast({
                title: "Added to cart!",
                description: `${product.title} has been added to your cart.`,
            });
        })
        .catch(error => {
            toast({
                variant: "destructive",
                title: "Could not add to cart",
                description: error.message,
            });
        });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };
  
  const displayVariant = product.variants?.[0];
  const displayPrice = displayVariant ? (displayVariant.sale_price_formatted || displayVariant.price_formatted) : '$0.00';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link to={`/product/${product.id}`}>
        <div className="glass-effect rounded-2xl overflow-hidden card-hover h-full flex flex-col">
          <div className="relative overflow-hidden">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white/20 backdrop-blur-sm border-white/30 h-8 w-8"
                onClick={handleWishlist}
                aria-label="Add to wishlist"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            {product.ribbon_text && (
              <div className="absolute top-2 left-2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  {product.ribbon_text}
                </span>
              </div>
            )}
          </div>
          
          <div className="p-4 flex flex-col flex-grow">
             <div className="flex items-center justify-between mb-1">
               {/* Note: Static data doesn't have category, API data does, but let's hide for consistency for now */}
              <span className="text-xs text-purple-300 font-medium">{product.category || ''}</span>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-white/70">4.8</span>
              </div>
            </div>
            
            <h3 className="text-base font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors truncate flex-grow">
              {product.title}
            </h3>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-lg font-bold text-white">
                {displayPrice}
              </span>
              
              <Button
                onClick={handleAddToCart}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-3"
                aria-label="Add to cart"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;