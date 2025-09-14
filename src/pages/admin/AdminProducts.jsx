import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useToast } from '../../components/ui/use-toast.js';
import { supabase } from '../../lib/supabase.js';
import { formatCurrency } from '../../lib/utils.js';
import { deleteProduct } from '../../api/EcommerceApi.js';
import ProductFormDialog from '../../components/admin/ProductFormDialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.jsx";


const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        toast({ variant: "destructive", title: "Failed to load products." });
    } else {
        setProducts(data);
        const uniqueCategories = ['All', ...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
    }
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    fetchProducts().finally(() => setLoading(false));

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };
  
  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const confirmDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
        await deleteProduct(productToDelete.id);
        toast({ title: "Product Deleted", description: `"${productToDelete.title}" has been removed.` });
        setProductToDelete(null);
    } catch (error) {
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    }
  };

  const onFormSubmit = () => {
    fetchProducts();
    setIsFormOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Products Management - Admin - AYExpress</title>
        <meta name="description" content="Manage products in the AYExpress admin panel." />
      </Helmet>
      
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Products</h1>
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
            className="glass-effect rounded-xl p-4"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="glass-effect rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-white font-semibold">Product</th>
                      <th className="text-left p-4 text-white font-semibold">Category</th>
                      <th className="text-left p-4 text-white font-semibold">Price</th>
                      <th className="text-left p-4 text-white font-semibold">Stock</th>
                      <th className="text-left p-4 text-white font-semibold">Status</th>
                      <th className="text-left p-4 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product, index) => {
                      const primaryVariant = product.variants?.[0];
                      const stock = primaryVariant?.inventory_quantity || 0;
                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="border-t border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                              <div>
                                <h3 className="text-white font-medium">{product.title}</h3>
                                <p className="text-white/70 text-xs">ID: {product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-purple-300">{product.category}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-white font-semibold">{formatCurrency(primaryVariant?.price_in_cents)}</span>
                          </td>
                          <td className="p-4">
                            <span className={`${stock > 10 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {stock}
                            </span>
                          </td>
                          <td className="p-4">
                             <span className={`px-3 py-1 rounded-full text-xs ${
                              !product.purchasable ? 'bg-gray-500/20 text-gray-300' :
                              stock > 0 ? 'bg-green-500/20 text-green-300' : 
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {!product.purchasable ? 'Archived' : stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(product)}
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
        </div>

        <ProductFormDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          product={editingProduct}
          onSuccess={onFormSubmit}
        />
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product "{productToDelete?.title}" and all its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </AdminLayout>
    </>
  );
};

export default AdminProducts;
