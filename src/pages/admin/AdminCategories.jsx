import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/EcommerceApi.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog.jsx";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addAdminNotification } = useAdminNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', parent_id: '' });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Failed to load categories.', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [addAdminNotification]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const categoryTree = useMemo(() => {
    const tree = [];
    const map = {};
    categories.forEach(cat => {
      map[cat.id] = { ...cat, children: [] };
    });
    categories.forEach(cat => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.id]);
      } else {
        tree.push(map[cat.id]);
      }
    });
    const flattened = [];
    const flatten = (nodes, depth = 0) => {
        nodes.sort((a,b) => a.name.localeCompare(b.name)).forEach(node => {
        flattened.push({ ...node, depth });
        if (node.children.length) {
          flatten(node.children, depth + 1);
        }
      });
    };
    flatten(tree);
    return flattened;
  }, [categories]);


  const handleOpenForm = (category = null) => {
    setEditingCategory(category);
    setFormData(category ? { name: category.name, parent_id: category.parent_id || '' } : { name: '', parent_id: '' });
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name: formData.name, parent_id: formData.parent_id || null };
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        addAdminNotification({ category: 'Categories', title: 'Category Updated' });
      } else {
        await createCategory(payload);
        addAdminNotification({ category: 'Categories', title: 'Category Created' });
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Operation Failed', message: error.message });
      setLoading(false);
    }
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      addAdminNotification({ category: 'Categories', title: "Category Deleted", message: `"${categoryToDelete.name}" has been removed.` });
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: "Deletion Failed", message: error.message });
    }
  };

  return (
    <>
      <Helmet><title>Categories Management - Admin</title></Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Categories</h1>
              <p className="text-white/70">Organize your products into categories and sub-categories</p>
            </div>
            <Button onClick={() => handleOpenForm()} className="bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="h-5 w-5 mr-2" />Add Category</Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-effect rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-white animate-spin" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-white font-semibold">Name</th>
                      <th className="text-left p-4 text-white font-semibold">Parent Category</th>
                      <th className="text-left p-4 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryTree.map((cat, index) => (
                      <motion.tr key={cat.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="border-t border-white/10 hover:bg-white/5">
                        <td className="p-4"><span className="text-white font-medium" style={{ paddingLeft: `${cat.depth * 20}px` }}>{cat.name}</span></td>
                        <td className="p-4"><span className="text-white/70">{cat.parent?.name || '—'}</span></td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenForm(cat)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(cat)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="glass-effect text-white border-white/20">
            <DialogHeader><DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Category Name</Label><Input id="name" name="name" value={formData.name} onChange={handleFormChange} required /></div>
              <div className="space-y-2"><Label htmlFor="parent_id">Parent Category</Label>
                <select id="parent_id" name="parent_id" value={formData.parent_id} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">None (Top-level)</option>
                  {categoryTree.filter(c => c.id !== editingCategory?.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{'--'.repeat(cat.depth)} {cat.name}</option>
                  ))}
                </select>
              </div>
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the category "{categoryToDelete?.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </>
  );
};

export default AdminCategories;