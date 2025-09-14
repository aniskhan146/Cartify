import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Filter, Search, Grid, List, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/api/EcommerceApi';
import { supabase } from '@/lib/supabase';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  
  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch products
            const apiResponse = await getProducts();
            setProducts(apiResponse.products);

            // Fetch distinct categories
            const { data: categoryData, error: categoryError } = await supabase
              .from('products')
              .select('category');
            
            if (categoryError) throw categoryError;
            
            const uniqueCategories = ['All', ...new Set(categoryData.map(p => p.category).filter(Boolean))];
            setCategories(uniqueCategories);

        } catch (err) {
            setError('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);


  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    filtered.sort((a, b) => {
      const priceA = a.variants[0]?.price_in_cents || 0;
      const priceB = b.variants[0]?.price_in_cents || 0;

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <>
      <Helmet>
        <title>Products - AYExpress</title>
        <meta name="description" content="Browse our extensive collection of premium products at AYExpress." />
      </Helmet>
      
      <div className="min-h-screen">
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                <span className="gradient-text">Our Products</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Discover our curated collection of premium products
              </p>
            </motion.div>

            {/* Filters and Search */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-effect rounded-2xl p-6 mb-8"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                        : "border-white/30 text-white hover:bg-white/10"
                      }
                    >
                      {category}
                    </Button>
                  ))}
                </div>

                {/* Sort and View */}
                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  
                  <div className="flex border border-white/20 rounded-xl overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Products Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-16 w-16 text-white animate-spin" />
                 </div>
              ) : error ? (
                <div className="text-center text-red-400 p-8">
                    <p>Error: {error}</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={`grid gap-4 md:gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="glass-effect rounded-2xl p-12 max-w-md mx-auto">
                    <Filter className="h-16 w-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                    <p className="text-white/70">Try adjusting your search or filter criteria</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Results Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center mt-8"
            >
              <p className="text-white/70">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductsPage;
