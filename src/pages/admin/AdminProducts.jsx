import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Filter, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, variants(price_in_cents, inventory_quantity)');

      if (error) {
        console.error("Error fetching products:", error);
        toast({ variant: "destructive", title: "Failed to load products." });
      } else {
        setProducts(data);
        const uniqueCategories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [toast]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (productId) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleDelete = (productId) => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleAddProduct = () => {
    toast({
      title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Products Management - Admin - AYExpress</title>
        <meta name="description" content="Manage products in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Products</h1>
              <p className="text-white/70">Manage your product catalog</p>
            </div>
            <Button
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Product
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="glass-effect rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
              
              <div className="flex items-center gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-6 text-white font-semibold">Product</th>
                      <th className="text-left p-6 text-white font-semibold">Category</th>
                      <th className="text-left p-6 text-white font-semibold">Price</th>
                      <th className="text-left p-6 text-white font-semibold">Stock</th>
                      <th className="text-left p-6 text-white font-semibold">Status</th>
                      <th className="text-left p-6 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => {
                      const primaryVariant = product.variants[0];
                      const stock = primaryVariant?.inventory_quantity || 0;
                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="border-t border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-6">
                            <div className="flex items-center space-x-4">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div>
                                <h3 className="text-white font-medium">{product.title}</h3>
                                <p className="text-white/70 text-sm">ID: {product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-purple-300">{product.category}</span>
                          </td>
                          <td className="p-6">
                            <span className="text-white font-semibold">{formatCurrency(primaryVariant?.price_in_cents)}</span>
                          </td>
                          <td className="p-6">
                            <span className={`${stock > 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {stock}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              stock > 0 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product.id)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center text-white/70"
          >
            <p>Showing {filteredProducts.length} of {products.length} products</p>
          </motion.div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminProducts;
