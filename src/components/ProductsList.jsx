import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button.jsx';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../hooks/useCart.jsx';
import { useToast } from './ui/use-toast.js';
import { getProducts } from '../api/EcommerceApi.js';
import { supabase } from '../lib/supabase.js';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const ProductCard = ({ product, index }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const displayVariant = useMemo(() => product.variants[0], [product]);
  const hasSale = useMemo(() => displayVariant && displayVariant.sale_price_in_cents !== null, [displayVariant]);
  const displayPrice = useMemo(() => hasSale ? displayVariant.sale_price_formatted : displayVariant.price_formatted, [displayVariant, hasSale]);
  const originalPrice = useMemo(() => hasSale ? displayVariant.price_formatted : null, [displayVariant, hasSale]);

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.variants || product.variants.length === 0) {
       toast({
        title: "Currently Unavailable",
        description: "This product has no purchase options.",
        variant: "destructive"
      });
      return;
    }

    if (product.variants.length > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    const defaultVariant = product.variants[0];

    try {
      await addToCart(product, defaultVariant, 1);
      toast({
        title: "Added to Cart! 🛒",
        description: `${product.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error adding to cart",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [product, addToCart, toast, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <Link to={`/product/${product.id}`}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm glass-card border-0 text-white overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="relative">
            <img
              src={product.image ||placeholderImage}
              alt={product.title}
              className="w-full h-64 object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all duration-300" />
            {product.ribbon_text && (
              <div className="absolute top-3 left-3 bg-pink-500/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {product.ribbon_text}
              </div>
            )}
            <div className="absolute top-3 right-3 bg-purple-500/80 text-white text-xs font-bold px-3 py-1 rounded-full flex items-baseline gap-1.5">
              {hasSale && (
                <span className="line-through opacity-70">{originalPrice}</span>
              )}
              <span>{displayPrice}</span>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-bold truncate">{product.title}</h3>
            <p className="text-sm text-gray-300 h-10 overflow-hidden">{product.subtitle || 'Check out this amazing product!'}</p>
            <Button onClick={handleAddToCart} className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold">
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProductCardSkeleton = () => (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm glass-card border-0 text-white overflow-hidden animate-pulse">
        <div className="w-full h-64 bg-slate-700/50" />
        <div className="p-4">
            <div className="h-5 bg-slate-700/50 rounded w-3/4 mb-2" />
            <div className="h-10 bg-slate-700/50 rounded w-full" />
            <div className="mt-4 h-10 bg-slate-700/50 rounded w-full" />
        </div>
    </div>
);

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
      try {
        setError(null);
        const productsResponse = await getProducts();
        setProducts(productsResponse.products);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts();

    const channel = supabase.channel('public:products');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Products change received!', payload);
        fetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' }, (payload) => {
        console.log('Variants change received!', payload);
        fetchProducts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
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
        <h3 className="text-2xl font-bold text-white mb-2">No Products Yet</h3>
        <p>Check back later, or if you're an admin, add a new product!</p>
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