import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Switch } from '../ui/switch.jsx';
import { useAdminNotification } from '../../hooks/useAdminNotification.jsx';
import { createProduct, updateProduct, getCategories, getBrands, getProductOptions } from '../../api/EcommerceApi.js';
import { generateProductDescription } from '../../api/GeminiApi.js';
import { Trash2, PlusCircle, Loader2, Sparkles, X, Check } from 'lucide-react';

const ProductFormDialog = ({ isOpen, setIsOpen, product, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [variants, setVariants] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const { addAdminNotification } = useAdminNotification();

  const resetForm = () => {
    setFormData({
      title: '', subtitle: '', description: '', image: '', category_id: '', brand_id: '', ribbon_text: '', purchasable: true,
    });
    setVariants([]);
    setSpecifications([]);
    setSelectedOptions([]);
  };

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [fetchedCategories, fetchedBrands, fetchedOptions] = await Promise.all([getCategories(), getBrands(), getProductOptions()]);
          setCategories(fetchedCategories);
          setBrands(fetchedBrands);
          setAllOptions(fetchedOptions);
        } catch (error) {
          addAdminNotification({ category: 'Errors', title: 'Failed to load data', message: 'Could not fetch necessary product data.' });
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
        
        const existingVariants = product.variants.map(v => ({
            ...v,
            price_in_cents: v.price_in_cents || 0,
            sale_price_in_cents: v.sale_price_in_cents || null,
            inventory_quantity: v.inventory_quantity || 0,
            manage_inventory: v.manage_inventory ?? true,
            options: v.options || [],
        }));
        setVariants(existingVariants);

        // Reconstruct selectedOptions from the first variant
        if (product.variants.length > 0 && product.variants[0].options) {
             const reconstructedOptions = product.variants[0].options.map(opt => {
                const fullOption = allOptions.find(o => o.id === opt.option_id);
                const selectedValues = new Set(product.variants.flatMap(v => v.options.filter(vo => vo.option_id === opt.option_id).map(vo => vo.value_id)));
                return {
                    option_id: opt.option_id,
                    name: opt.option_name,
                    values: Array.from(selectedValues).map(value_id => {
                       const valueObj = fullOption?.product_option_values.find(v => v.id === value_id);
                       return { value_id: value_id, value: valueObj?.value };
                    }),
                };
             });
             setSelectedOptions(reconstructedOptions);
        }

        setSpecifications(Object.entries(product.specifications || {}).map(([key, value]) => ({ id: `spec-${key}-${Math.random()}`, key, value })));
      } else {
        resetForm();
      }
    }
  }, [product, isOpen, addAdminNotification]);
  
  const handleGenerateVariants = () => {
    const optionsWithValues = selectedOptions.filter(o => o.values && o.values.length > 0);
    if (optionsWithValues.length === 0) {
        addAdminNotification({category: 'Warning', title: 'No Options Selected', message: 'Please select at least one option and one value to generate variants.'});
        return;
    }

    // Cartesian product function
    const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    
    const valueArrays = optionsWithValues.map(o => o.values);
    const combinations = cartesian(...valueArrays);

    const newVariants = combinations.map((combo, index) => {
        const options = Array.isArray(combo) ? combo : [combo];
        return {
            temp_id: `new-${Date.now()}-${index}`,
            price_in_cents: 0,
            sale_price_in_cents: null,
            inventory_quantity: 0,
            manage_inventory: true,
            sku: '',
            options: options.map((optValue, i) => ({
                option_id: optionsWithValues[i].option_id,
                option_name: optionsWithValues[i].name,
                value_id: optValue.value_id,
                value: optValue.value
            }))
        };
    });
    setVariants(newVariants);
  };
  

  const handleOptionChange = (optionId, optionName) => {
    setSelectedOptions(prev => {
      const isSelected = prev.some(o => o.option_id === optionId);
      if (isSelected) {
        return prev.filter(o => o.option_id !== optionId);
      } else {
        return [...prev, { option_id: optionId, name: optionName, values: [] }];
      }
    });
  };

  const handleValueChange = (optionId, valueId, value) => {
    setSelectedOptions(prev => prev.map(opt => {
      if (opt.option_id === optionId) {
        const isSelected = opt.values.some(v => v.value_id === valueId);
        if (isSelected) {
          return { ...opt, values: opt.values.filter(v => v.value_id !== valueId) };
        } else {
          return { ...opt, values: [...opt.values, { value_id: valueId, value: value }] };
        }
      }
      return opt;
    }));
  };
  
  const handleVariantChange = (id, field, value) => setVariants(prev => prev.map(v => ( (v.id === id || v.temp_id === id) ? { ...v, [field]: value } : v)));
  const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSpecChange = (id, field, value) => setSpecifications(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));
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
    
    try {
      if (product) {
        await updateProduct(product.id, productPayload, variants);
        addAdminNotification({ category: 'Products', title: 'Product Updated', message: `"${formData.title}" has been successfully updated.` });
      } else {
        await createProduct(productPayload, variants);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl glass-effect text-white border-white/20">
        <DialogHeader><DialogTitle className="text-2xl">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" value={formData.title} onChange={handleFormChange} required /></div><div className="space-y-2"><Label htmlFor="subtitle">Subtitle</Label><Input id="subtitle" name="subtitle" value={formData.subtitle} onChange={handleFormChange} /></div></div>
          <div className="space-y-2"><div className="flex justify-between items-center mb-1"><Label htmlFor="description">Description</Label><Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !formData.title || !formData.category_id} className="text-xs px-2 py-1 h-auto border-purple-400/50 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200" aria-busy={isGeneratingDesc}><Sparkles className={`h-3 w-3 mr-1 ${isGeneratingDesc ? 'animate-spin' : ''}`} /> Generate with AI</Button></div><Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} rows={4} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="image">Image URL</Label><Input id="image" name="image" value={formData.image} onChange={handleFormChange} /></div><div className="space-y-2"><Label htmlFor="ribbon_text">Ribbon Text</Label><Input id="ribbon_text" name="ribbon_text" placeholder="e.g., Sale" value={formData.ribbon_text} onChange={handleFormChange} /></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="category_id">Category</Label><select id="category_id" name="category_id" value={formData.category_id} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select Category</option>{categoryTree.map(cat => <option key={cat.id} value={cat.id}>{'--'.repeat(cat.depth)} {cat.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="brand_id">Brand</Label><select id="brand_id" name="brand_id" value={formData.brand_id} onChange={handleFormChange} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select Brand</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div></div>
          <div className="flex items-center space-x-2"><Switch id="purchasable" checked={formData.purchasable} onCheckedChange={(checked) => setFormData(p => ({...p, purchasable: checked}))} /><Label htmlFor="purchasable">Purchasable</Label></div>
          <div className="space-y-2"><h3 className="text-lg font-semibold border-b border-white/10 pb-2">Specifications</h3>{specifications.map((spec) => (<div key={spec.id} className="flex items-center gap-2"><Input placeholder="Key (e.g., Weight)" value={spec.key} onChange={(e) => handleSpecChange(spec.id, 'key', e.target.value)} /><Input placeholder="Value (e.g., 250g)" value={spec.value} onChange={(e) => handleSpecChange(spec.id, 'value', e.target.value)} /><Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => removeSpecification(spec.id)}><Trash2 className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" className="border-white/30" onClick={addSpecification}><PlusCircle className="h-4 w-4 mr-2" /> Add Specification</Button></div>
          
          {/* Variant Options */}
          <div className="space-y-4 glass-card p-4 rounded-lg">
             <h3 className="text-lg font-semibold">Product Options</h3>
              {allOptions.map(option => (
                <div key={option.id}>
                    <button type="button" onClick={() => handleOptionChange(option.id, option.name)} className="w-full flex justify-between items-center text-left font-medium text-white p-2 rounded-md hover:bg-white/10">
                        <span>{option.name}</span>
                        {selectedOptions.some(o => o.option_id === option.id) ? <Check className="h-5 w-5 text-purple-400" /> : <PlusCircle className="h-5 w-5 text-white/50" />}
                    </button>
                    {selectedOptions.some(o => o.option_id === option.id) && (
                        <div className="pl-4 pt-2 flex flex-wrap gap-2">
                            {option.product_option_values.map(v => (
                                <button key={v.id} type="button" onClick={() => handleValueChange(option.id, v.id, v.value)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedOptions.find(o=>o.option_id === option.id)?.values.some(sv=>sv.value_id===v.id) ? 'bg-purple-500/80 border-purple-400 text-white' : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>
                                    {v.value}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
              ))}
              <Button type="button" onClick={handleGenerateVariants} className="w-full bg-blue-500 hover:bg-blue-600">Generate Variants</Button>
          </div>

          {/* Variants Table */}
          {variants.length > 0 && (
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Generated Variants ({variants.length})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="p-2 text-left font-semibold">Variant</th>
                                <th className="p-2 text-left font-semibold">Price ($)</th>
                                <th className="p-2 text-left font-semibold">SKU</th>
                                <th className="p-2 text-left font-semibold">Stock</th>
                                <th className="p-2 text-left font-semibold">Manage Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map(variant => (
                                <tr key={variant.id || variant.temp_id} className="border-b border-white/10">
                                    <td className="p-2 text-purple-300">{variant.options.map(o => o.value).join(' / ')}</td>
                                    <td className="p-2"><Input type="number" step="0.01" className="h-8" value={(variant.price_in_cents / 100) || 0} onChange={(e) => handleVariantChange(variant.id || variant.temp_id, 'price_in_cents', Math.round(parseFloat(e.target.value) * 100) || 0)} /></td>
                                    <td className="p-2"><Input className="h-8" value={variant.sku} onChange={(e) => handleVariantChange(variant.id || variant.temp_id, 'sku', e.target.value)} /></td>
                                    <td className="p-2"><Input type="number" className="h-8" value={variant.inventory_quantity} disabled={!variant.manage_inventory} onChange={(e) => handleVariantChange(variant.id || variant.temp_id, 'inventory_quantity', parseInt(e.target.value, 10) || 0)} /></td>
                                    <td className="p-2 text-center"><Switch checked={variant.manage_inventory} onCheckedChange={(checked) => handleVariantChange(variant.id || variant.temp_id, 'manage_inventory', checked)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}
          
          <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button><Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{product ? 'Save Changes' : 'Create Product'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default ProductFormDialog;
