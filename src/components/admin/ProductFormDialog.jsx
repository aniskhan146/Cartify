import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Label } from '../ui/label.jsx';
import { Textarea } from '../ui/textarea.jsx';
import { Switch } from '../ui/switch.jsx';
import { useToast } from '../ui/use-toast.js';
import { createProduct, updateProduct } from '../../api/EcommerceApi.js';
import { generateProductDescription } from '../../api/GeminiApi.js';
import { Trash2, PlusCircle, Loader2, Sparkles } from 'lucide-react';

const ProductFormDialog = ({ isOpen, setIsOpen, product, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    category: '',
    ribbon_text: '',
    purchasable: true,
  });
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        subtitle: product.subtitle || '',
        description: product.description || '',
        image: product.image || '',
        category: product.category || '',
        ribbon_text: product.ribbon_text || '',
        purchasable: product.purchasable ?? true,
      });
      setVariants(
        product.variants.map(v => ({
          ...v,
          price_in_cents: v.price_in_cents || 0,
          sale_price_in_cents: v.sale_price_in_cents || null,
          inventory_quantity: v.inventory_quantity || 0,
          manage_inventory: v.manage_inventory ?? true,
        }))
      );
    } else {
      // Reset form for new product
      setFormData({
        title: '', subtitle: '', description: '', image: '', category: '', ribbon_text: '', purchasable: true,
      });
      setVariants([{ id: `new-${Date.now()}`, title: 'Default', price_in_cents: 0, sale_price_in_cents: null, inventory_quantity: 0, manage_inventory: true }]);
    }
  }, [product, isOpen]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleVariantChange = (id, field, value) => {
    setVariants(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { id: `new-${Date.now()}`, title: '', price_in_cents: 0, sale_price_in_cents: null, inventory_quantity: 0, manage_inventory: true }]);
  };

  const removeVariant = (id) => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter(v => v.id !== id));
    } else {
        toast({ variant: 'destructive', title: "Cannot remove the last variant." });
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      toast({
        variant: 'destructive',
        title: 'Title and Category Needed',
        description: 'Please provide a product title and category before generating a description.',
      });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const description = await generateProductDescription(formData.title, formData.category);
      setFormData(prev => ({ ...prev, description }));
      toast({
        title: 'Description Generated!',
        description: 'The AI-powered description has been added.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message,
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const variantsToSubmit = variants.map(v => ({
        // If the ID is a real ID (number), keep it for update. Otherwise, it's a new variant.
        ...(typeof v.id === 'number' && { id: v.id }),
        title: v.title,
        price_in_cents: Math.round(v.price_in_cents),
        sale_price_in_cents: v.sale_price_in_cents ? Math.round(v.sale_price_in_cents) : null,
        inventory_quantity: v.inventory_quantity,
        manage_inventory: v.manage_inventory,
    }));

    try {
        if (product) { // Editing existing product
            await updateProduct(product.id, formData, variantsToSubmit);
            toast({ title: 'Product Updated', description: `"${formData.title}" has been successfully updated.` });
        } else { // Creating new product
            await createProduct(formData, variantsToSubmit);
            toast({ title: 'Product Created', description: `"${formData.title}" has been successfully created.` });
        }
        onSuccess();
    } catch (error) {
        console.error("Form submission error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl glass-effect text-white border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of your product.' : 'Fill in the details to create a new product.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
          {/* Product Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" value={formData.subtitle} onChange={handleFormChange} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc || !formData.title || !formData.category}
                className="text-xs px-2 py-1 h-auto border-purple-400/50 text-purple-300 hover:bg-purple-400/10 hover:text-purple-200"
              >
                {isGeneratingDesc ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea id="description" name="description" value={formData.description} onChange={handleFormChange} />
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" value={formData.image} onChange={handleFormChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleFormChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center">
             <div className="space-y-2">
              <Label htmlFor="ribbon_text">Ribbon Text (e.g., "Sale")</Label>
              <Input id="ribbon_text" name="ribbon_text" value={formData.ribbon_text} onChange={handleFormChange} />
            </div>
            <div className="flex items-center space-x-2 pt-6">
                <Switch id="purchasable" checked={formData.purchasable} onCheckedChange={(checked) => setFormData(p => ({...p, purchasable: checked}))} />
                <Label htmlFor="purchasable">Purchasable</Label>
            </div>
          </div>
          
          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Variants</h3>
            {variants.map((variant, index) => (
                <div key={variant.id} className="glass-card p-4 rounded-lg space-y-3 relative">
                    {variants.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-400 hover:text-red-300" onClick={() => removeVariant(variant.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Variant Title</Label>
                            <Input value={variant.title} onChange={(e) => handleVariantChange(variant.id, 'title', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Price (in Cents)</Label>
                            <Input type="number" value={variant.price_in_cents} onChange={(e) => handleVariantChange(variant.id, 'price_in_cents', parseInt(e.target.value, 10))} />
                        </div>
                         <div className="space-y-2">
                            <Label>Sale Price (in Cents)</Label>
                            <Input type="number" placeholder="Optional" value={variant.sale_price_in_cents || ''} onChange={(e) => handleVariantChange(variant.id, 'sale_price_in_cents', e.target.value ? parseInt(e.target.value, 10) : null)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Inventory Quantity</Label>
                            <Input type="number" value={variant.inventory_quantity} onChange={(e) => handleVariantChange(variant.id, 'inventory_quantity', parseInt(e.target.value, 10))} />
                        </div>
                    </div>
                </div>
            ))}
             <Button type="button" variant="outline" className="border-white/30" onClick={addVariant}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Variant
            </Button>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;