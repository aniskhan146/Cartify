import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import ProductsList from '../components/ProductsList.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Slider } from '../components/ui/slider.jsx';
import Pagination from '../components/Pagination.jsx';
import { getProducts, getUniqueCategories } from '../api/EcommerceApi.js';
import { getSearchParamsFromNaturalLanguage } from '../api/GeminiApi.js';
import { useDebounce } from '../hooks/useDebounce.jsx';
import { formatCurrency } from '../lib/utils.js';
import { useToast } from '../components/ui/use-toast.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../components/ui/dialog.jsx';


const PRODUCTS_PER_PAGE = 8;
const MAX_PRICE_CENTS = 500000; // $5000

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE_CENTS]);
  const [uiPriceRange, setUiPriceRange] = useState([0, MAX_PRICE_CENTS]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedPriceRange = useDebounce(priceRange, 500);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const fetchCategories = useCallback(async () => {
    const uniqueCategories = await getUniqueCategories();
    setCategories(['All', ...uniqueCategories]);
  }, []);

  const fetchStoreProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { products: fetchedProducts, count } = await getProducts({
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
        category: selectedCategory,
        searchTerm: debouncedSearchTerm,
        priceRange: debouncedPriceRange,
      });

      setProducts(fetchedProducts);
      setTotalProducts(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, debouncedSearchTerm, debouncedPriceRange]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  useEffect(() => {
    fetchStoreProducts();
  }, [fetchStoreProducts]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedSearchTerm, debouncedPriceRange]);

  // Sync search term with URL
  useEffect(() => {
     if (debouncedSearchTerm) {
        setSearchParams({ q: debouncedSearchTerm }, { replace: true });
     } else {
        setSearchParams({}, { replace: true });
     }
  }, [debouncedSearchTerm, setSearchParams]);

  const handleAiSearch = async () => {
    setIsAiLoading(true);
    try {
      const availableCats = categories.filter(c => c !== 'All');
      const params = await getSearchParamsFromNaturalLanguage(aiQuery, availableCats);
      setSearchTerm(params.searchTerm);
      setSelectedCategory(params.category);
      setIsAiDialogOpen(false);
      setAiQuery('');
      toast({
        title: 'AI Search Applied!',
        description: `Now showing results for "${params.searchTerm}" in ${params.category}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: 'AI Assistant Error',
        description: error.message,
      });
    } finally {
      setIsAiLoading(false);
    }
  };


  return (
    <>
      <Helmet>
        <title>Store - AYExpress</title>
        <meta name="description" content="Browse our extensive collection of premium products at AYExpress." />
      </Helmet>
      
      <div className="min-h-screen">
        <div className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Our Store</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Discover our curated collection of premium products.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="glass-effect rounded-2xl p-6 space-y-8 sticky top-24">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Search</h3>
                    <div className="flex items-center gap-2">
                       <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 h-5 w-5" />
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="icon" className="border-purple-400/50 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200 flex-shrink-0" aria-label="Open AI search assistant">
                             <Sparkles className="h-5 w-5"/>
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-effect text-white border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2"><Sparkles className="text-purple-300"/>AI Search Assistant</DialogTitle>
                            <DialogDescription>
                              Describe what you're looking for, and our AI will suggest the best filters for you.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor="ai-query">Your Request</Label>
                            <Textarea 
                              id="ai-query" 
                              placeholder="e.g., 'A gift for my mom who loves gardening'"
                              value={aiQuery}
                              onChange={(e) => setAiQuery(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsAiDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAiSearch} disabled={isAiLoading || !aiQuery} className="bg-gradient-to-r from-purple-500 to-pink-500">
                               {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Get Suggestions
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                            selectedCategory === category
                              ? 'bg-purple-500/30 text-white font-semibold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Price Range</h3>
                    <Slider
                      value={uiPriceRange}
                      onValueChange={setUiPriceRange}
                      onValueCommit={setPriceRange}
                      max={MAX_PRICE_CENTS}
                      step={100}
                    />
                     <div className="flex justify-between text-xs text-white/70 mt-2">
                      <span>{formatCurrency(uiPriceRange[0])}</span>
                      <span>{formatCurrency(uiPriceRange[1])}</span>
                    </div>
                  </div>
                </div>
              </motion.aside>

              {/* Products Grid */}
              <main className="lg:col-span-3">
                <ProductsList
                  products={products}
                  loading={loading}
                  error={error}
                  skeletonCount={PRODUCTS_PER_PAGE}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </main>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StorePage;