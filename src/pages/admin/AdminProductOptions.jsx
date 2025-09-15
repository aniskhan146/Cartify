import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Loader2, X, Tag } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import { getProductOptions, upsertProductOption, deleteProductOption } from '../../api/EcommerceApi.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../../components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog.jsx";

const AdminProductOptions = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addAdminNotification } = useAdminNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [optionName, setOptionName] = useState('');
  const [optionValues, setOptionValues] = useState([]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState(null);

  const fetchOptions = useCallback(async () => {
    try {
      const data = await getProductOptions();
      setOptions(data);
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Failed to load options.', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [addAdminNotification]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);
  
  const handleOpenForm = (option = null) => {
    setEditingOption(option);
    if(option) {
        setOptionName(option.name);
        setOptionValues(option.product_option_values.map(v => ({...v, temp_id: v.id})));
    } else {
        setOptionName('');
        setOptionValues([{ temp_id: Date.now(), value: '' }]);
    }
    setIsFormOpen(true);
  };
  
  const handleValueChange = (temp_id, newValue) => {
    setOptionValues(prev => prev.map(v => v.temp_id === temp_id ? {...v, value: newValue} : v));
  };
  
  const addValue = () => setOptionValues(prev => [...prev, { temp_id: Date.now(), value: '' }]);
  const removeValue = (temp_id) => setOptionValues(prev => prev.filter(v => v.temp_id !== temp_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const nonEmptyValues = optionValues.filter(v => v.value.trim() !== '');
    try {
      await upsertProductOption(optionName, nonEmptyValues);
      addAdminNotification({ category: 'Products', title: `Option ${editingOption ? 'Updated' : 'Created'}` });
      setIsFormOpen(false);
      fetchOptions();
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Operation Failed', message: error.message });
    } finally {
        setLoading(false);
    }
  };

  const confirmDelete = (option) => {
    setOptionToDelete(option);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!optionToDelete) return;
    try {
      await deleteProductOption(optionToDelete.id);
      addAdminNotification({ category: 'Products', title: "Option Deleted", message: `"${optionToDelete.name}" has been removed.` });
      setOptionToDelete(null);
      fetchOptions();
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: "Deletion Failed", message: error.message });
    }
  };

  return (
    <>
      <Helmet><title>Product Options - Admin</title></Helmet>
      <AdminLayout>
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
            <div><h1 className="text-2xl font-bold text-white">Product Options</h1><p className="text-white/70">Manage reusable options for product variants (e.g., Color, Size).</p></div>
            <Button onClick={() => handleOpenForm()} className="bg-gradient-to-r from-purple-500 to-pink-500"><Plus className="h-5 w-5 mr-2" />Add Option</Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="md:col-span-2 lg:col-span-3 flex justify-center items-center h-64"><Loader2 className="h-12 w-12 text-white animate-spin" /></div>
            ) : (
              options.map((option, index) => (
                <motion.div key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass-effect rounded-xl p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white">{option.name}</h3>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(option)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(option)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="flex-grow flex flex-wrap gap-2">
                    {option.product_option_values.map(val => (
                        <span key={val.id} className="bg-white/10 text-white/90 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"><Tag className="h-3 w-3 text-purple-300"/>{val.value}</span>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="glass-effect text-white border-white/20">
            <DialogHeader>
                <DialogTitle>{editingOption ? 'Edit Option' : 'Add New Option'}</DialogTitle>
                <DialogDescription>Define an option and its possible values.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="optionName">Option Name</Label><Input id="optionName" placeholder="e.g., Color" value={optionName} onChange={(e) => setOptionName(e.target.value)} required /></div>
              <div className="space-y-2">
                <Label>Option Values</Label>
                {optionValues.map((v) => (
                    <div key={v.temp_id} className="flex items-center gap-2">
                        <Input placeholder="e.g., Red" value={v.value} onChange={(e) => handleValueChange(v.temp_id, e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="text-red-400" onClick={() => removeValue(v.temp_id)}><X className="h-4 w-4"/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" className="border-white/30 text-sm" onClick={addValue}><Plus className="h-4 w-4 mr-2"/>Add Value</Button>
              </div>
              <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Save'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the option "{optionToDelete?.name}" and all its values. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </>
  );
};

export default AdminProductOptions;
