import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { useToast } from '../../components/ui/use-toast.js';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../api/EcommerceApi.js';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "../../components/ui/dialog.jsx";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "../../components/ui/alert-dialog.jsx";

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '', logo_url: '' });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);

  const fetchBrands = useCallback(async () => {
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load brands.', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleOpenForm = (brand = null) => {
    setEditingBrand(brand);
    setFormData(brand ? { name: brand.name, logo_url: brand.logo_url || '' } : { name: '', logo_url: '' });
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, formData);
        toast({ title: 'Brand Updated' });
      } else {
        await createBrand(formData);
        toast({ title: 'Brand Created' });
      }
      setIsFormOpen(false);
      fetchBrands();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error.message });
      setLoading(false);
    }
  };

  const confirmDelete = (brand) => {
    setBrandToDelete(brand);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;
    try {
      await deleteBrand(brandToDelete.id);
      toast({ title: "Brand Deleted", description: `"${brandToDelete.name}" has been removed.` });
      setBrandToDelete(null);
      fetchBrands();
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed", description: "Make sure no products are using this brand." });
    }
  };

  return (
    <>
      <Helmet><title>Brands Management - Admin</title></Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Brands</h1>
              <p className="text-white/70">Manage your product brands</p>
            </div>
            <Button onClick={() => handleOpenForm()} className="bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="h-5 w-5 mr-2" />Add Brand</Button>
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
                      <th className="text-left p-4 text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map((brand, index) => (
                      <motion.tr key={brand.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="border-t border-white/10 hover:bg-white/5">
                        <td className="p-4">
                            <div className="flex items-center space-x-3">
                                <img src={brand.logo_url || `https://avatar.vercel.sh/${brand.name}.svg?text=${brand.name[0]}`} alt={brand.name} className="w-8 h-8 rounded-md bg-white/10 object-contain p-1"/>
                                <span className="text-white font-medium">{brand.name}</span>
                            </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenForm(brand)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(brand)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></Button>
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
            <DialogHeader><DialogTitle>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="name">Brand Name</Label><Input id="name" name="name" value={formData.name} onChange={handleFormChange} required /></div>
              <div className="space-y-2"><Label htmlFor="logo_url">Logo URL</Label><Input id="logo_url" name="logo_url" value={formData.logo_url} onChange={handleFormChange} /></div>
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the brand "{brandToDelete?.name}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </>
  );
};

export default AdminBrands;
