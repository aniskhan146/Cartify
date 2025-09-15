import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Switch } from '../ui/switch.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import { createProduct, updateProduct, getCategories, getBrands } from '../../api/EcommerceApi.js';
import { generateProductDescription } from '../../api/GeminiApi.js';
import { Trash2, PlusCircle, Loader2, Sparkles } from 'lucide-react';

const ProductFormDialog = ({ isOpen, setIsOpen, product, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [variants, setVariants] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const { addAdminNotification } = useAdminNotification();

  const resetForm = () => {
    setFormData({
      title: '', subtitle: '', description: '', image: '', category_id: '', brand_id: '', ribbon_text: '', purchasable: true,
    });
    setVariants([{ id: `new-${Date.now()}`, title: 'Default', price_in_cents: 0, sale_price_in_cents: null, inventory_quantity: 0, manage_inventory: true, sku: '', color_hex: '#ffffff' }]);
    setSpecifications([]);
  };

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [fetchedCategories, fetchedBrands] = await Promise.all([getCategories(), getBrands()]);
          setCategories(fetchedCategories);
          setBrands(fetchedBrands);
        } catch (error) {
          addAdminNotification({ category: 'Errors', title: 'Failed to load data', message: 'Could not fetch categories or brands.' });
        }
      };
      fetchData();

      if (product) {
        setFormData({
          title: product.title || '',
          subtitle: product.subtitle || '',
          description: product.description || '',
          image: product.image || '',
          category_id: product.category_id || '',
          brand_id: product.brand_id || '',
          ribbon_text: product.ribbon_text || '',
          purchasable: product.purchasable ?? true,
        });
        setVariants(product.variants.map(v => ({...v, price_in_cents: v.price_in_cents || 0, sale_price_in_cents: v.sale_price_in_cents || null, inventory_quantity: v.inventory_quantity || 0, manage_inventory: v.manage_inventory ?? true, color_hex: v.color_hex || '#ffffff' })));
        setSpecifications(Object.entries(product.specifications || {}).map(([key, value]) => ({ id: `spec-${key}-${Math.random()}`, key, value })));
      } else {
        resetForm();
      }
    }
  }, [product, isOpen, addAdminNotification]);

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
      nodes.forEach(node => {
        flattened.push({ ...node, depth });
        if (node.children.length) {
          flatten(node.children, depth + 1);
        }
      });
    };
    flatten(tree);
    return flattened;
  }, [categories]);

  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleVariantChange = (id, field, value) => setVariants(prev => prev.map(v => (v.id === id ? { ...v, [field]: value } : v)));
  const handleSpecChange = (id, field, value) => setSpecifications(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  
  const addVariant = () => setVariants(prev => [...prev, { id: `new-${Date.now()}`, title: '', price_in_cents: 0, sale_price_in_cents: null, inventory_quantity: 0, manage_inventory: true, sku: '', color_hex: '#ffffff' }]);
  const removeVariant = (id) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter(v => v.id !== id));
    } else {
      addAdminNotification({ category: 'Products', title: "Cannot remove the last variant." });
    }
  };

  const addSpecification = () => setSpecifications(prev => [...prev, { id: `new-${Date.now()}`, key: '', value: '' }]);
  const removeSpecification = (id) => setSpecifications(prev => prev.filter(s => s.id !== id));

  const handleGenerateDescription = async () => {
    const categoryName = categories.find(c => c.id === formData.category_id)?.name;
    if (!formData.title || !categoryName) {
      addAdminNotification({ category: 'AI', title: 'Title and Category Needed', message: 'Please provide a product title and select a category.' });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const description = await generateProductDescription(formData.title, categoryName);
      setFormData(prev => ({ ...prev, description }));
      addAdminNotification({ category: 'AI', title: 'Description Generated!', message: 'The AI-powered description has been added.' });
    } catch (error) {
      addAdminNotification({ category: 'Errors', title: 'Generation Failed', message: error.message });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const productPayload = { 
      ...formData,
      category_id: formData.category_id || null,
      brand_id: formData.brand_id || null,
      specifications: specifications.reduce((acc, spec) => { if (spec.key) acc[spec.key] = spec.value; return acc; }, {}) 
    };
    
    const variantsPayload = variants.map(v => ({ 
        ...(typeof v.id === 'number' && { id: v.id }), 
        title: v.title, 
        price_in_cents: Math.round(v.price_in_cents || 0), 
        sale_price_in_cents: v.sale_price_in_cents ? Math.round(v.sale_price_in_cents) : null, 
        inventory_quantity: v.inventory_quantity || 0, 
        manage_inventory: v.manage_inventory, 
        sku: v.sku, 
        color_hex: v.color_hex 
    }));

    try {
      if (product) {
        await updateProduct(product.id, productPayload, variantsPayload);
        addAdminNotification({ category: 'Products', title: 'Product Updated', message: `"${formData.title}" has been successfully updated.` });
      } else {
        await createProduct(productPayload, variantsPayload);
        addAdminNotification({ category: 'Products', title: 'Product Created', message: `"${formData.title}" has been successfully created.` });
      }
      onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
      addAdminNotification({ category: 'Errors', title: 'Submission Failed', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl glass-effect text-white border-white/20">
        <DialogHeader><DialogTitle className="text-2xl">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" value={formData.title} onChange={handleFormChange} required /></div>
            <div className="space-y-2"><Label htmlFor="subtitle">Subtitle</Label><Input id="subtitle" name="subtitle" value={formData.subtitle} onChange={handleFormChange} /></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1"><Label htmlFor="description">Description</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !formData.title || !formData.category_id} className="text-xs px-2 py-1 h-auto border-purple-400/50 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200" aria-busy={isGeneratingDesc}><Sparkles className={`h-3 w-3 mr-1 ${isGeneratingDesc ? 'animate-spin' : ''}`} /> Generate with AI</Button>
            </div>
            <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="image">Image URL</Label><Input id="image" name="image" value={formData.image} onChange={handleFormChange} /></div>
            <div className="space-y-2"><Label htmlFor="ribbon_text">Ribbon Text</Label><Input id="ribbon_text" name="ribbon_text" placeholder="e.g., Sale" value={formData.ribbon_text} onChange={handleFormChange} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="category_id">Category</Label><select id="category_id" name="category_id" value={formData.category_id} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select Category</option>{categoryTree.map(cat => <option key={cat.id} value={cat.id}>{'--'.repeat(cat.depth)} {cat.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="brand_id">Brand</Label><select id="brand_id" name="brand_id" value={formData.brand_id} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select Brand</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
          </div>
          <div className="flex items-center space-x-2"><Switch id="purchasable" checked={formData.purchasable} onCheckedChange={(checked) => setFormData(p => ({...p, purchasable: checked}))} /><Label htmlFor="purchasable">Purchasable</Label></div>
          
          <div className="space-y-2"><h3 className="text-lg font-semibold border-b border-white/10 pb-2">Specifications</h3>{specifications.map((spec) => (<div key={spec.id} className="flex items-center gap-2"><Input placeholder="Key (e.g., Weight)" value={spec.key} onChange={(e) => handleSpecChange(spec.id, 'key', e.target.value)} /><Input placeholder="Value (e.g., 250g)" value={spec.value} onChange={(e) => handleSpecChange(spec.id, 'value', e.target.value)} /><Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => removeSpecification(spec.id)}><Trash2 className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" className="border-white/30" onClick={addSpecification}><PlusCircle className="h-4 w-4 mr-2" /> Add Specification</Button></div>
          
          <div className="space-y-4"><h3 className="text-lg font-semibold border-b border-white/10 pb-2">Variants</h3>{variants.map((variant) => (<div key={variant.id} className="glass-card p-4 rounded-lg space-y-3 relative">{variants.length > 1 && (<Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-300" onClick={() => removeVariant(variant.id)}><Trash2 className="h-4 w-4" /></Button>)}<div className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="space-y-2"><Label>Variant Title</Label><Input placeholder="e.g., Small, Blue" value={variant.title} onChange={(e) => handleVariantChange(variant.id, 'title', e.target.value)} required /></div><div className="space-y-2"><Label>SKU</Label><Input value={variant.sku || '(auto-generated)'} disabled /></div><div className="space-y-2"><Label>Color</Label><div className="flex items-center gap-2"><input type="color" value={variant.color_hex} onChange={(e) => handleVariantChange(variant.id, 'color_hex', e.target.value)} className="w-10 h-10 p-1 bg-transparent border-none rounded-md cursor-pointer" /><Input className="flex-1" value={variant.color_hex} onChange={(e) => handleVariantChange(variant.id, 'color_hex', e.target.value)} /></div></div><div className="space-y-2"><Label>Price (Cents)</Label><Input type="number" value={variant.price_in_cents} onChange={(e) => handleVariantChange(variant.id, 'price_in_cents', parseInt(e.target.value, 10) || 0)} /></div><div className="space-y-2"><Label>Sale Price (Cents)</Label><Input type="number" placeholder="Optional" value={variant.sale_price_in_cents || ''} onChange={(e) => handleVariantChange(variant.id, 'sale_price_in_cents', e.target.value ? parseInt(e.target.value, 10) : null)} /></div><div className="space-y-2"><Label>Inventory</Label><Input type="number" value={variant.inventory_quantity} onChange={(e) => handleVariantChange(variant.id, 'inventory_quantity', parseInt(e.target.value, 10) || 0)} /></div></div></div>))}<Button type="button" variant="outline" className="border-white/30" onClick={addVariant}><PlusCircle className="h-4 w-4 mr-2" />Add Variant</Button></div>
          
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{product ? 'Save Changes' : 'Create Product'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default ProductFormDialog;