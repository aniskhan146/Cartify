import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { useNotification } from '../../hooks/useNotification.jsx';
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addNotification } = useNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*, variants(*), categories(name), brands(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
        addNotification({ type: "error", title: "Failed to load products.", message: error.message });
    } else {
        setProducts(data);
    }
  }, [addNotification]);
  
  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (error) console.error("Error fetching categories:", error);
    else setCategories([{ id: 'All', name: 'All Categories' }, ...data]);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false));

    const channel = supabase.channel('public:products_admin');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variants' }, fetchProducts)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [fetchProducts, fetchCategories]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category_id == selectedCategory;
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
        addNotification({ type: 'success', title: "Product Archived", message: `"${productToDelete.title}" has been archived and is no longer purchasable.` });
        setProductToDelete(null);
        fetchProducts(); // Refresh list immediately
    } catch (error) {
        addNotification({ type: 'error', title: "Archive Failed", message: error.message });
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
                <label htmlFor="product-search" className="sr-only">Search products</label>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  id="product-search"
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label htmlFor="category-filter" className="sr-only">Filter by category</label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
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
                      <th className="text-left p-4 text-white font-semibold">Brand</th>
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
                                <p className="text-white/70 text-xs">SKU: {primaryVariant?.sku || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-purple-300">{product.categories?.name || 'N/A'}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-blue-300">{product.brands?.name || 'N/A'}</span>
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
                                aria-label={`Edit ${product.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(product)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                aria-label={`Delete ${product.title}`}
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
              <AlertDialogTitle>Archive Product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive the product "{productToDelete?.title}", making it unavailable for purchase. It will not be removed from existing orders. You can re-enable it later by editing the product.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Archive Product</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </AdminLayout>
    </>
  );
};

export default AdminProducts;