import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProduct, getRelatedProducts } from '../api/EcommerceApi.js';
import { Button } from '../components/ui/button.jsx';
import { useCart } from '../hooks/useCart.jsx';
import { useWishlist } from '../hooks/useWishlist.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNotification } from '../hooks/useNotification.jsx';
import { supabase } from '../lib/supabase.js';
import ProductsList from '../components/ProductsList.jsx';
import { ShoppingCart, Heart, Loader2, ArrowLeft, CheckCircle, Minus, Plus, XCircle } from 'lucide-react';
import { cn } from '../lib/utils.js';

const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzc0MTUxIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K";

const ProductDetailSkeleton = () => (
    <div className="max-w-screen-xl mx-auto p-4 md:p-0">
        <div className="inline-flex items-center gap-2 mb-6 animate-pulse">
            <div className="h-4 w-4 bg-slate-700/50 rounded" />
            <div className="h-5 w-24 bg-slate-700/50 rounded" />
        </div>
        <div className="grid md:grid-cols-2 gap-8 glass-card p-8 rounded-2xl animate-pulse">
            <div><div className="relative overflow-hidden rounded-lg shadow-2xl h-96 md:h-[500px] bg-slate-700/50" /><div className="flex gap-2 mt-4"><div className="flex-shrink-0 w-16 h-16 rounded-md bg-slate-700/50" /><div className="flex-shrink-0 w-16 h-16 rounded-md bg-slate-700/50" /><div className="flex-shrink-0 w-16 h-16 rounded-md bg-slate-700/50" /></div></div>
            <div className="flex flex-col"><div className="h-10 w-3/4 bg-slate-700/50 rounded mb-3" /><div className="h-6 w-1/2 bg-slate-700/50 rounded mb-6" /><div className="h-12 w-48 bg-slate-700/50 rounded mb-6" /><div className="space-y-3 mb-6"><div className="h-4 bg-slate-700/50 rounded" /><div className="h-4 bg-slate-700/50 rounded" /><div className="h-4 bg-slate-700/50 rounded w-5/6" /></div><div className="mb-6"><div className="h-5 w-16 bg-slate-700/50 rounded mb-2" /><div className="flex flex-wrap gap-2"><div className="h-9 w-20 bg-slate-700/50 rounded-md" /><div className="h-9 w-24 bg-slate-700/50 rounded-md" /></div></div><div className="flex items-center gap-4 mb-6"><div className="h-10 w-32 bg-slate-700/50 rounded-full" /></div><div className="mt-auto"><div className="h-12 w-full bg-slate-700/50 rounded-lg" /><div className="h-5 w-48 bg-slate-700/50 rounded mt-3 mx-auto" /></div></div>
        </div>
    </div>
);


function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [availabilityMap, setAvailabilityMap] = useState({});

  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(null);
  
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const { addNotification } = useNotification();

  const fetchProductData = useCallback(async () => {
      try {
        setLoading(true);
        const fetchedProduct = await getProduct(id);
        setProduct(fetchedProduct);
        setCurrentImage(fetchedProduct.image || placeholderImage);

        // Initialize selected options with the first available variant's options
        if (fetchedProduct.variants && fetchedProduct.variants.length > 0) {
            const initialVariant = fetchedProduct.variants.find(v => v.inventory_quantity > 0 && v.manage_inventory) || fetchedProduct.variants[0];
            const initialOptions = {};
            initialVariant.options.forEach(opt => {
                initialOptions[opt.option_id] = opt.value_id;
            });
            setSelectedOptions(initialOptions);
        }

        const fetchedRelated = await getRelatedProducts(id, fetchedProduct.category_id);
        setRelatedProducts(fetchedRelated);
      } catch (err) {
        setError(err.message || 'Failed to load product');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }, [id]);

  useEffect(() => {
    fetchProductData();
    // Realtime updates can be complex with this data structure, skipping for now
  }, [id, fetchProductData]);
  
  // Find the matching variant whenever selected options change
  useEffect(() => {
    if (product && product.variants && Object.keys(selectedOptions).length > 0) {
      const findVariant = () => {
        return product.variants.find(variant => {
          return Object.entries(selectedOptions).every(([optionId, valueId]) =>
            variant.options.some(opt => opt.option_id == optionId && opt.value_id == valueId)
          );
        });
      };
      const variant = findVariant();
      setSelectedVariant(variant);
      setQuantity(1); // Reset quantity
    }
  }, [selectedOptions, product]);
  
  // Pre-calculate option availability to disable invalid combinations
  useEffect(() => {
    if (!product || !product.options) return;

    const newAvailabilityMap = {};
    product.options.forEach(option => {
        newAvailabilityMap[option.id] = {};
        option.values.forEach(value => {
            newAvailabilityMap[option.id][value.id] = false; // default to false
        });
    });
    
    product.variants.forEach(variant => {
        if (!variant.manage_inventory || variant.inventory_quantity > 0) {
            variant.options.forEach(opt => {
                newAvailabilityMap[opt.option_id][opt.value_id] = true;
            });
        }
    });
    setAvailabilityMap(newAvailabilityMap);

  }, [product]);

  const handleOptionChange = (optionId, valueId) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: valueId
    }));
  };
  
  const handleAddToCart = useCallback(async () => {
    if (product && selectedVariant) {
      try {
        await addToCart(product, selectedVariant, quantity);
        const variantTitle = selectedVariant.options.map(o => o.value).join(' / ');
        addNotification({
          type: "success",
          title: "Added to Cart! 🛒",
          message: `${quantity} x ${product.title} (${variantTitle}) added.`,
        });
      } catch (error) {
        addNotification({
          type: "error",
          title: "Oh no! Something went wrong.",
          message: error.message,
        });
      }
    }
  }, [product, selectedVariant, quantity, addToCart, addNotification]);

  const handleQuantityChange = useCallback((amount) => {
    const availableStock = selectedVariant?.manage_inventory ? selectedVariant.inventory_quantity : Infinity;
    setQuantity(prevQuantity => {
        const newQuantity = prevQuantity + amount;
        if (newQuantity < 1) return 1;
        if (newQuantity > availableStock) return availableStock;
        return newQuantity;
    });
  }, [selectedVariant]);

  const handleWishlistToggle = useCallback(() => {
    if (!user) {
      addNotification({ type: 'warning', title: "Please login", message: "You need to be logged in to manage your wishlist."});
      navigate('/login');
      return;
    }
    const wishlisted = isWishlisted(product.id);
    if (wishlisted) {
      removeFromWishlist(product.id);
      addNotification({ type: 'info', title: "Removed from wishlist", message: `${product.title} removed from your wishlist.` });
    } else {
      addToWishlist(product.id);
      addNotification({ type: 'success', title: "Added to wishlist!", message: `${product.title} added to your wishlist.` });
    }
  }, [user, product, isWishlisted, addToWishlist, removeFromWishlist, addNotification, navigate]);
  

  if (loading && !product) {
    return <div className="pt-24 pb-16"><ProductDetailSkeleton /></div>;
  }

  if (error || !product) {
    return (
      <div className="pt-24 pb-16 max-w-screen-xl mx-auto p-4"><Link to="/store" className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors mb-6"><ArrowLeft size={16} />Back to Store</Link><div className="text-center text-red-400 p-8 glass-card rounded-2xl"><XCircle className="mx-auto h-16 w-16 mb-4" /><p className="text-xl font-bold mb-2">Product Not Found</p><p className="mb-6">{error || 'The product you are looking for does not exist.'}</p></div></div>
    );
  }

  const availableStock = selectedVariant?.manage_inventory ? selectedVariant.inventory_quantity : Infinity;
  const isOutOfStock = selectedVariant ? (selectedVariant.manage_inventory && selectedVariant.inventory_quantity < 1) : product.variants.length === 0;
  const wishlisted = isWishlisted(product.id);
  const imageGallery = [product.image, ...(product.galleryImages || [])].filter(Boolean);

  return (
    <>
      <Helmet><title>{product.title} - AYExpress</title><meta name="description" content={product.description?.substring(0, 160) || product.title} /></Helmet>
      <div className="pt-24 pb-16 max-w-screen-xl mx-auto p-4 md:p-0">
        <Link to="/store" className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors mb-6"><ArrowLeft size={16} />Back to Store</Link>
        <div className="grid md:grid-cols-2 gap-8 glass-card p-8 rounded-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}><div className="relative overflow-hidden rounded-lg shadow-2xl h-96 md:h-[500px] group"><img src={currentImage || placeholderImage} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /></div>{imageGallery.length > 1 && (<div className="flex gap-2 mt-4">{imageGallery.map((imgUrl, index) => (<button key={index} onClick={() => setCurrentImage(imgUrl)} className="focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"><img src={imgUrl} alt={`Thumbnail ${index + 1}`} className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-all ${currentImage === imgUrl ? 'border-purple-500' : 'border-transparent hover:border-white/50'}`} /></button>))}</div>)}</motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col">
            <div className="flex items-center gap-4 text-sm text-purple-300 mb-2">{product.brands?.name && <span>{product.brands.name}</span>}{product.brands?.name && product.categories?.name && <span>&bull;</span>}{product.categories?.name && <span>{product.categories.name}</span>}</div>
            <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
            <p className="text-lg text-gray-300 mb-4">{product.subtitle}</p>
            <div className="flex items-baseline gap-3 mb-6"><span className="text-3xl font-bold text-purple-400">{selectedVariant?.sale_price_formatted ?? selectedVariant?.price_formatted ?? '$--.--'}</span>{selectedVariant?.sale_price_in_cents && (<span className="text-xl text-gray-400 line-through">{selectedVariant?.price_formatted}</span>)}</div>
            <div className="prose prose-invert text-gray-300 mb-6" dangerouslySetInnerHTML={{ __html: product.description }} />
            
            {/* Options Selector */}
            <div className="space-y-4 mb-6">
                {product.options.map(option => (
                    <div key={option.id}>
                        <h3 className="text-sm font-medium text-white mb-2">{option.name}</h3>
                        <div className="flex flex-wrap gap-2">
                            {option.values.map(value => {
                                const isSelected = selectedOptions[option.id] === value.id;
                                const isDisabled = !availabilityMap[option.id]?.[value.id];
                                return (
                                <Button
                                    key={value.id}
                                    variant={isSelected ? 'default' : 'outline'}
                                    onClick={() => handleOptionChange(option.id, value.id)}
                                    disabled={isDisabled}
                                    className={cn(
                                        'transition-all',
                                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20 text-white hover:bg-white/10',
                                        isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent' : ''
                                    )}
                                >
                                    {value.value}
                                </Button>
                            )})}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-white/20 rounded-full p-1">
                <Button onClick={() => handleQuantityChange(-1)} variant="ghost" size="icon" className="rounded-full h-8 w-8 text-white hover:bg-white/10" aria-label="Decrease quantity"><Minus size={16} /></Button>
                <span className="w-10 text-center text-white font-bold">{quantity}</span>
                <Button onClick={() => handleQuantityChange(1)} variant="ghost" size="icon" className="rounded-full h-8 w-8 text-white hover:bg-white/10" aria-label="Increase quantity" disabled={quantity >= availableStock}><Plus size={16} /></Button>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-3">
              <Button onClick={handleAddToCart} size="lg" className="flex-grow bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 text-lg" disabled={!selectedVariant || isOutOfStock}>
                <ShoppingCart className="mr-2 h-5 w-5" /> {isOutOfStock ? 'Out of Stock' : !selectedVariant ? 'Select Options' : 'Add to Cart'}
              </Button>
               <Button size="lg" variant="outline" className="px-0 h-12 w-12 flex-shrink-0 rounded-full border-white/20 text-white hover:bg-white/10" onClick={handleWishlistToggle}><Heart className={`h-6 w-6 transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white'}`} /></Button>
            </div>
             <div className="mt-3 text-center">
              {selectedVariant && !isOutOfStock && (<p className="text-sm text-green-400 flex items-center justify-center gap-2"><CheckCircle size={16} />{selectedVariant.manage_inventory ? `${availableStock} in stock!` : 'Available'}</p>)}
              {selectedVariant && isOutOfStock && (<p className="text-sm text-yellow-400 flex items-center justify-center gap-2"><XCircle size={16} />Out of Stock</p>)}
             </div>
          </motion.div>
        </div>
        
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} className="text-center mb-12"><h2 className="text-3xl font-bold text-white mb-3">You Might Also Like</h2><p className="text-lg text-white/70">Customers also viewed these products</p></motion.div>
            <ProductsList products={relatedProducts} loading={loading} error={null} skeletonCount={4} />
          </div>
        )}
      </div>
    </>
  );
}

export default ProductDetailPage;
