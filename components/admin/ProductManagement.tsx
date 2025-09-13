import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Product, Variant, VariantOption, VariantOptionValue, Category as DbCategory, Brand } from '../../types';
import { MoreVerticalIcon, ClipboardIcon, DownloadIcon, Trash2Icon, SearchIcon, UploadIcon, XIcon } from '../shared/icons';
import { generateProductDescription } from '../../services/geminiService';
import { saveProduct, deleteProduct, onCategoriesValueChange, saveCategory, onVariantOptionsChange } from '../../services/databaseService';
import { formatCurrency } from '../shared/utils';
import ConfirmationModal from './ConfirmationModal';
import { cn } from '../../lib/utils';
import { v4 as uuidv4 } from 'uuid'; // For unique variant IDs
import { useNotification } from '../../contexts/NotificationContext';

const initialFormState: Omit<Product, 'id' | 'rating' | 'reviews' | 'variants'> & { variants: Variant[] } = {
    name: '',
    category: '',
    brandId: '',
    description: '',
    imageUrls: [],
    variants: [],
    deliveryTimescale: '',
};

// Helper function for Cartesian product
const cartesian = <T,>(...args: T[][]): T[][] => {
  const r: T[][] = [];
  const max = args.length - 1;
  const helper = (arr: T[], i: number) => {
    for (let j = 0; j < args[i].length; j++) {
      const a = [...arr, args[i][j]];
      if (i === max) {
        r.push(a);
      } else {
        helper(a, i + 1);
      }
    }
  };
  helper([], 0);
  return r;
};


// Form Modal as a separate component to manage its own state
const ProductFormModal = ({ mode, product, onClose, onSubmit, formErrorExt, categories, allBrands, onAddNewCategory }: {
    mode: 'add' | 'edit';
    product: Product | null;
    onClose: () => void;
    onSubmit: (data: Omit<Product, 'id'>, id?: string) => Promise<boolean>;
    formErrorExt: string;
    categories: DbCategory[];
    allBrands: Brand[];
    onAddNewCategory: () => void;
}) => {
    const [formData, setFormData] = useState(initialFormState);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiCallback, setAiCallback] = useState<(desc: string) => void>(() => () => {});
    const [productNameForAi, setProductNameForAi] = useState('');
    const [keywords, setKeywords] = useState('');
    const [generatedDesc, setGeneratedDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [copyText, setCopyText] = useState('Copy & Use');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [imageUrlError, setImageUrlError] = useState('');
    
    // New state for variant generation
    const [allVariantOptions, setAllVariantOptions] = useState<VariantOption[]>([]);
    const [selectedOptionTypes, setSelectedOptionTypes] = useState<VariantOption[]>([]);
    const [selectedOptionValues, setSelectedOptionValues] = useState<{ [key: string]: string[] }>({});

     useEffect(() => {
        const unsubscribe = onVariantOptionsChange(setAllVariantOptions);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setFormError(formErrorExt);
    }, [formErrorExt]);
    
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                category: product.category || '',
                brandId: product.brandId || '',
                description: product.description || '',
                imageUrls: product.imageUrls || [],
                variants: product.variants || [],
                deliveryTimescale: product.deliveryTimescale || '',
            });
            // Pre-fill variant options based on existing product variants
            if (product.variants && product.variants.length > 0) {
                const firstVariantOptions = product.variants[0].options || {};
                const optionNames = Object.keys(firstVariantOptions);
                const matchingOptions = allVariantOptions.filter(opt => optionNames.includes(opt.name));
                setSelectedOptionTypes(matchingOptions);
                
                const initialValues: { [key: string]: string[] } = {};
                matchingOptions.forEach(opt => {
                    const values = [...new Set(product.variants.map(v => v.options[opt.name]).filter(Boolean))];
                    initialValues[opt.id] = values;
                });
                setSelectedOptionValues(initialValues);
            } else {
                 setSelectedOptionTypes([]);
                 setSelectedOptionValues({});
            }

        } else {
            setFormData(initialFormState);
            setSelectedOptionTypes([]);
            setSelectedOptionValues({});
        }
        setNewImageUrl('');
        setImageUrlError('');
    }, [product, allVariantOptions]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addFilesToState = (filesToAdd: File[]) => {
        const imagePromises = filesToAdd.map(file => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises)
            .then(base64Urls => {
                setFormData(prev => ({
                    ...prev,
                    imageUrls: [...prev.imageUrls, ...base64Urls],
                }));
            })
            .catch(error => {
                console.error("Error converting files to base64:", error);
                setFormError("There was an error processing the uploaded images.");
            });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFilesToState(Array.from(e.target.files));
        }
    };

    const handleImageUrlAdd = () => {
        setImageUrlError('');
        if (newImageUrl.trim()) {
            const urls = newImageUrl.split(/[\n,]+/).map(url => url.trim()).filter(Boolean);
            const validUrls: string[] = [];
            const invalidUrls: string[] = [];
    
            urls.forEach(url => {
                try {
                    new URL(url);
                    if (!formData.imageUrls.includes(url)) {
                        validUrls.push(url);
                    }
                } catch (_) {
                    invalidUrls.push(url);
                }
            });
    
            if (validUrls.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    imageUrls: [...prev.imageUrls, ...validUrls],
                }));
            }
            
            if (invalidUrls.length > 0) {
                setImageUrlError(`Some URLs were invalid and were not added. Please check them.`);
            } else {
                 setNewImageUrl(''); // Clear only if all are valid
            }
        }
    };
    
    const handleVariantChange = (index: number, field: keyof Omit<Variant, 'options'>, value: string | number) => {
        const updatedVariants = [...formData.variants];
        const variantToUpdate = { ...updatedVariants[index] };
        (variantToUpdate[field] as any) = value;
        updatedVariants[index] = variantToUpdate;
        setFormData(prev => ({ ...prev, variants: updatedVariants }));
    };
    
    const removeVariant = (indexToRemove: number) => {
        setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== indexToRemove) }));
    };

    const handleOptionTypeSelect = (optionId: string) => {
        const option = allVariantOptions.find(opt => opt.id === optionId);
        if (option && !selectedOptionTypes.some(opt => opt.id === optionId)) {
            setSelectedOptionTypes(prev => [...prev, option]);
        }
    };
    
    const handleRemoveOptionType = (optionId: string) => {
        setSelectedOptionTypes(prev => prev.filter(opt => opt.id !== optionId));
        setSelectedOptionValues(prev => {
            const newValues = { ...prev };
            delete newValues[optionId];
            return newValues;
        });
    };

    const handleOptionValueToggle = (optionId: string, value: string) => {
        setSelectedOptionValues(prev => {
            const currentValues = prev[optionId] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [optionId]: newValues };
        });
    };
    
    const handleGenerateVariants = () => {
        if (selectedOptionTypes.length === 0) {
            setFormError("Please select at least one option type to generate variants.");
            return;
        }
    
        const valueArrays = selectedOptionTypes.map(opt => selectedOptionValues[opt.id] || []);
    
        if (valueArrays.some(arr => arr.length === 0)) {
            setFormError("Please select at least one value for each option type.");
            return;
        }
    
        const combinations = cartesian(...valueArrays);
    
        const newVariants: Variant[] = combinations.map(combo => {
            const options: { [key: string]: string } = {};
            selectedOptionTypes.forEach((opt, i) => {
                options[opt.name] = combo[i];
            });
    
            const name = selectedOptionTypes.map(opt => options[opt.name]).join(' / ');
            
            // Try to find an existing variant to preserve its data
            const existingVariant = formData.variants.find(v => 
                Object.entries(options).every(([key, value]) => v.options[key] === value)
            );
    
            return {
                id: existingVariant?.id || uuidv4(),
                options,
                name,
                price: existingVariant?.price || 0,
                originalPrice: existingVariant?.originalPrice,
                stock: existingVariant?.stock || 0,
                imageUrl: existingVariant?.imageUrl || '',
            };
        });
    
        setFormData(prev => ({ ...prev, variants: newVariants }));
        setFormError("");
    };


    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFilesToState(Array.from(e.dataTransfer.files));
            e.dataTransfer.clearData();
        }
    };

    const removeImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            imageUrls: prev.imageUrls.filter((_, i) => i !== indexToRemove),
        }));
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!formData.category) {
            setFormError("Please select a category for the product.");
            return;
        }
        if (formData.variants.length === 0) {
            setFormError("Product must have at least one variant. Please generate variants.");
            return;
        }

        // Validate variants
        for (const variant of formData.variants) {
            const price = Number(variant.price);
            const stock = Number(variant.stock);
            const originalPrice = variant.originalPrice ? Number(variant.originalPrice) : undefined;
            if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
                setFormError(`Price and stock for variant "${variant.name}" must be positive numbers.`);
                return;
            }
            if (originalPrice !== undefined && (isNaN(originalPrice) || originalPrice <= price)) {
                 setFormError(`Original price for variant "${variant.name}" must be greater than the sale price.`);
                return;
            }
        }


        setIsSaving(true);
        
        const productData: Omit<Product, 'id'> = {
            name: formData.name,
            category: formData.category,
            brandId: formData.brandId || undefined,
            description: formData.description,
            imageUrls: formData.imageUrls.length ? formData.imageUrls : ['https://picsum.photos/seed/placeholder/400/300'],
            variants: formData.variants.map(v => ({
                ...v,
                price: Number(v.price),
                stock: Number(v.stock),
                originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
            })),
            rating: product?.rating || parseFloat((Math.random() * (5 - 3.5) + 3.5).toFixed(1)),
            reviews: product?.reviews || Math.floor(Math.random() * 2000),
            deliveryTimescale: formData.deliveryTimescale,
        };

        const success = await onSubmit(productData, product?.id);
        setIsSaving(false);
        if (success) {
            onClose();
        }
    };

    const handleGenerateDescription = useCallback(async () => {
        if (!productNameForAi) {
            setAiError('Please provide a product name.');
            return;
        }
        setIsGenerating(true); setAiError(''); setGeneratedDesc(''); setCopyText('Copy & Use');
        try {
            const description = await generateProductDescription(productNameForAi, keywords);
            setGeneratedDesc(description);
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    }, [productNameForAi, keywords]);

    const handleCopyToClipboard = () => {
        if (!generatedDesc) return;
        aiCallback(generatedDesc);
        setCopyText('Copied!');
        setTimeout(() => { setIsAiModalOpen(false); }, 1000);
    };

    const openAiModal = () => {
        setProductNameForAi(formData.name);
        setKeywords(''); setGeneratedDesc(''); setAiError('');
        setAiCallback(() => (desc: string) => {
            setFormData(prev => ({ ...prev, description: desc }));
        });
        setIsAiModalOpen(true);
    };
    
    const AiModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] modal-backdrop" onClick={() => setIsAiModalOpen(false)}>
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg relative modal-content border border-border" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">AI Product Description Generator</h2>
              <div className="space-y-4">
                  <input type="text" placeholder="Product Name" value={productNameForAi} onChange={(e) => setProductNameForAi(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background" />
                  <input type="text" placeholder="Keywords (e.g., waterproof, leather, durable)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background" />
                  {aiError && <p className="text-red-500 text-sm">{aiError}</p>}
                  {generatedDesc && (
                      <div className="bg-muted p-4 rounded-md mt-4 space-y-3">
                          <h3 className="font-semibold">Generated Description:</h3>
                          <p className="text-sm whitespace-pre-wrap bg-background p-3 rounded-md max-h-40 overflow-y-auto border border-border">{generatedDesc}</p>
                      </div>
                  )}
              </div>
              <div className="mt-6 flex justify-end items-center space-x-3 border-t border-border pt-4">
                  <button onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Close</button>
                   {generatedDesc ? (
                       <button onClick={handleCopyToClipboard} className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center space-x-2"><ClipboardIcon className="h-4 w-4" /><span>{copyText}</span></button>
                   ) : (
                       <button onClick={handleGenerateDescription} disabled={isGenerating} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">{isGenerating ? 'Generating...' : 'Generate'}</button>
                   )}
              </div>
          </div>
      </div>
    );
    
    return (
        <>
        {isAiModalOpen && <AiModal />}
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop" onClick={onClose}>
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col modal-content border border-border" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 flex-shrink-0">{mode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
            <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6">
              {formError && <p className="text-red-500 text-sm mb-4 p-2 bg-red-500/10 rounded-md">{formError}</p>}
              
              <div>
                <h3 className="text-lg font-semibold mb-3 border-b border-border pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" placeholder="Product Name" value={formData.name} onChange={handleFormChange} className="w-full p-2 border border-input rounded-md bg-background" required/>
                    <div className="flex items-center space-x-2">
                        <select name="category" value={formData.category} onChange={handleFormChange} className="w-full p-2 border border-input rounded-md bg-background" required>
                            <option value="" disabled>Select a category</option>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <button type="button" onClick={onAddNewCategory} className="flex-shrink-0 bg-muted text-foreground p-2 rounded-lg font-semibold hover:bg-accent h-full text-lg transition-colors">+</button>
                    </div>
                    <select name="brandId" value={formData.brandId || ''} onChange={handleFormChange} className="w-full p-2 border border-input rounded-md bg-background">
                        <option value="">Select a brand (optional)</option>
                        {allBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                    <input name="deliveryTimescale" placeholder="Delivery Timescale (e.g., 2-4 business days)" value={formData.deliveryTimescale} onChange={handleFormChange} className="w-full p-2 border border-input rounded-md bg-background"/>
                </div>
                 <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">Description</label>
                    <button type="button" onClick={openAiModal} className="text-xs bg-purple-600 text-white px-2 py-1 rounded-md font-semibold hover:bg-purple-700 transition-colors">✨ Generate with AI</button>
                  </div>
                  <textarea id="description" name="description" placeholder="Detailed product description..." value={formData.description} onChange={handleFormChange} rows={5} className="w-full p-2 border border-input rounded-md bg-background"></textarea>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 border-b border-border pb-2">Product Variants</h3>
                 <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-muted-foreground mb-1">1. Add Option Types</label>
                            <select onChange={(e) => handleOptionTypeSelect(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background" value="">
                                <option value="" disabled>Choose an option type...</option>
                                {allVariantOptions.filter(opt => !selectedOptionTypes.some(sOpt => sOpt.id === opt.id)).map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-muted-foreground mb-1">Selected Types</label>
                            <div className="space-x-2">
                                {selectedOptionTypes.length > 0 ? selectedOptionTypes.map(opt => (
                                    <span key={opt.id} className="inline-flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm font-medium">
                                        {opt.name}
                                        <button type="button" onClick={() => handleRemoveOptionType(opt.id)} className="ml-1.5 text-secondary-foreground hover:text-foreground"><XIcon className="h-4 w-4"/></button>
                                    </span>
                                )) : <p className="text-xs text-muted-foreground pt-2">No option types selected.</p>}
                            </div>
                        </div>
                    </div>
                    {selectedOptionTypes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">2. Select Values for Each Type</label>
                            <div className="space-y-3">
                            {selectedOptionTypes.map(opt => (
                                <div key={opt.id}>
                                    <p className="font-semibold text-sm mb-1">{opt.name}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(opt.values || []).map(valObj => {
                                            // Handle old string data gracefully
                                            const value = typeof valObj === 'string' ? { name: valObj } : valObj;
                                            return (
                                            <button type="button" key={value.name} onClick={() => handleOptionValueToggle(opt.id, value.name)}
                                                className={cn("px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all flex items-center gap-2",
                                                (selectedOptionValues[opt.id] || []).includes(value.name) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                                                )}
                                            >
                                            {value.colorCode && <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: value.colorCode }} />}
                                            {value.name}
                                            </button>
                                        )})}
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">3. Generate Variants</label>
                        <button type="button" onClick={handleGenerateVariants} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">
                            Generate {formData.variants.length > 0 ? 'and Overwrite' : ''} Variants
                        </button>
                    </div>
                </div>

                {formData.variants.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                     <p className="text-sm font-medium text-muted-foreground mb-2">4. Configure Generated Variants</p>
                    {formData.variants.map((variant, index) => (
                        <div key={variant.id} className="bg-muted/50 p-3 rounded-lg border border-border">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-sm">{variant.name}</p>
                                <button type="button" onClick={() => removeVariant(index)} className="text-destructive hover:text-destructive/80"><Trash2Icon className="h-4 w-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <input type="number" placeholder="Price" value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} className="p-2 border border-input rounded-md bg-background text-sm" required/>
                                <input type="number" placeholder="Stock" value={variant.stock} onChange={e => handleVariantChange(index, 'stock', e.target.value)} className="p-2 border border-input rounded-md bg-background text-sm" required/>
                                <input type="number" placeholder="Original Price" value={variant.originalPrice || ''} onChange={e => handleVariantChange(index, 'originalPrice', e.target.value)} className="p-2 border border-input rounded-md bg-background text-sm" />
                                <input placeholder="Image URL (optional)" value={variant.imageUrl || ''} onChange={e => handleVariantChange(index, 'imageUrl', e.target.value)} className="p-2 border border-input rounded-md bg-background text-sm col-span-4 md:col-span-1"/>
                            </div>
                        </div>
                    ))}
                </div>
                )}
              </div>

              <div>
                  <h3 className="text-lg font-semibold mb-3 border-b border-border pb-2">General Images (Fallbacks)</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-2">
                      {formData.imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                              <img src={url} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md bg-muted" />
                              <button type="button" onClick={() => removeImage(index)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                          </div>
                      ))}
                      <label htmlFor="imageUpload" onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave} className={cn("w-full h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-accent hover:border-primary cursor-pointer transition-all", isDraggingOver && "border-primary bg-primary/10")}>
                        <UploadIcon className="h-6 w-6 mb-1" />
                        <span className="text-xs text-center font-medium">Click or drag</span>
                      </label>
                      <input id="imageUpload" type="file" multiple onChange={handleImageChange} accept="image/*" className="hidden"/>
                  </div>
                    <div className="flex items-center my-4"><div className="flex-grow border-t border-border"></div><span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or</span><div className="flex-grow border-t border-border"></div></div>
                    <div>
                        <label htmlFor="newImageUrl" className="block text-sm font-medium text-muted-foreground mb-1">Add Image by URL</label>
                        <p className="text-xs text-muted-foreground mb-2">Enter one or more image URLs, separated by commas or new lines.</p>
                        <div className="flex items-start space-x-2">
                            <textarea 
                                id="newImageUrl" 
                                rows={3}
                                value={newImageUrl} 
                                onChange={(e) => setNewImageUrl(e.target.value)} 
                                placeholder="https://example.com/image1.png, https://example.com/image2.png" 
                                className="flex-grow p-2 border border-input rounded-md bg-background" 
                            />
                            <button type="button" onClick={handleImageUrlAdd} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors self-center">Add</button>
                        </div>
                        {imageUrlError && <p className="text-red-500 text-xs mt-1">{imageUrlError}</p>}
                    </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3 border-t border-border pt-4 flex-shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">{isSaving ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
        </>
    );
};


interface ProductManagementProps {
    products: Product[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: 'all' | 'inStock' | 'outOfStock';
    onStatusFilterChange: (filter: 'all' | 'inStock' | 'outOfStock') => void;
    categoryFilter: string | null;
    onClearCategoryFilter: () => void;
    allCategories: DbCategory[];
    allBrands: Brand[];
    isFormModalOpen: boolean;
    modalMode: 'add' | 'edit';
    currentProduct: Product | null;
    formError: string;
    openFormModal: (mode: 'add' | 'edit', product?: Product | null, prefill?: Partial<Product>) => void;
    closeFormModal: () => void;
    onFormSubmit: (data: Omit<Product, 'id'>, id?: string) => Promise<boolean>;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
    products, searchQuery, onSearchChange, statusFilter, onStatusFilterChange,
    categoryFilter, onClearCategoryFilter, allCategories, allBrands,
    isFormModalOpen, modalMode, currentProduct, formError, openFormModal, closeFormModal, onFormSubmit
}) => {
    const { addNotification } = useNotification();
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    
    // New Category Modal State
    const [newCategoryData, setNewCategoryData] = useState({ name: '', iconUrl: '' });
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState('');
    const categoryFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (products) setIsLoadingData(false);
    }, [products]);

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete.id);
            addNotification(`Product "${productToDelete.name}" deleted successfully.`, 'success');
            setIsConfirmModalOpen(false);
            setProductToDelete(null);
        } catch (err) {
            addNotification("Failed to delete product.", 'error');
            setIsConfirmModalOpen(false);
        }
    };
    
    const handleCategoryIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewCategoryData(prev => ({ ...prev, iconUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveNewCategory = async () => {
        if (!newCategoryData.name.trim()) {
            setCategoryError("Category name cannot be empty.");
            return;
        }
        if (!newCategoryData.iconUrl) {
            setCategoryError("Please upload an icon for the category.");
            return;
        }
        setIsSavingCategory(true); setCategoryError('');
        try {
            await saveCategory({ name: newCategoryData.name, iconUrl: newCategoryData.iconUrl, productCount: 0 });
            setIsSavingCategory(false);
            setNewCategoryData({ name: '', iconUrl: '' });
            setIsCategoryModalOpen(false);
            addNotification('New category added!', 'success');
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : 'Failed to save category');
            setIsSavingCategory(false);
        }
    };
    
    const handleExportCSV = () => {
        if (!products.length) return;
        const headers = ['ID', 'Name', 'Category', 'Description', 'Variant SKU', 'Variant Name', 'Price', 'OriginalPrice', 'Stock'];
        let csvRows: string[] = [];

        const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        
        products.forEach(p => {
            (p.variants || []).forEach(v => {
                 const row = [p.id, p.name, p.category, p.description, v.id, v.name, v.price, v.originalPrice, v.stock].map(escapeCsv).join(',');
                 csvRows.push(row);
            });
        });
        
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const getPriceRange = (variants: Variant[] = []) => {
        if (!variants || variants.length === 0) return 'N/A';
        const prices = variants.map(v => v.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) return formatCurrency(minPrice);
        return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
    };

    const AddCategoryModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] modal-backdrop" onClick={() => setIsCategoryModalOpen(false)}>
            <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md modal-content border border-border" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Add New Category</h2>
                {categoryError && <p className="text-red-500 text-sm mb-4">{categoryError}</p>}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="newCategoryName" className="block text-sm font-medium text-muted-foreground mb-1">Category Name</label>
                        <input id="newCategoryName" type="text" value={newCategoryData.name} onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })} className="w-full p-2 border border-input rounded-md bg-background" placeholder="e.g., Health & Wellness"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Icon</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden">
                                {newCategoryData.iconUrl ? (
                                    <img src={newCategoryData.iconUrl} alt="Icon Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs text-center text-muted-foreground">No Icon</span>
                                )}
                            </div>
                            <input type="file" ref={categoryFileInputRef} onChange={handleCategoryIconChange} accept="image/*" className="hidden" />
                            <button type="button" onClick={() => categoryFileInputRef.current?.click()} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">
                                Upload Icon
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end items-center space-x-3 border-t border-border pt-4">
                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
                    <button onClick={handleSaveNewCategory} disabled={isSavingCategory} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">
                        {isSavingCategory ? 'Saving...' : 'Save Category'}
                    </button>
                </div>
            </div>
        </div>
    );
    // FIX: Add return statement with JSX to render the component UI.
    return (
        <>
            {isFormModalOpen && (
                <ProductFormModal
                    mode={modalMode}
                    product={currentProduct}
                    onClose={closeFormModal}
                    onSubmit={onFormSubmit}
                    formErrorExt={formError}
                    categories={allCategories}
                    allBrands={allBrands}
                    onAddNewCategory={() => setIsCategoryModalOpen(true)}
                />
            )}
            {isCategoryModalOpen && <AddCategoryModal />}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Product"
                message={`Are you sure you want to delete the product "${productToDelete?.name}"? This action cannot be undone.`}
            />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Products</h1>
                <div className="flex items-center space-x-2">
                    <button onClick={handleExportCSV} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors text-sm flex items-center space-x-2">
                        <DownloadIcon className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                    <button onClick={() => openFormModal('add')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-card p-4 rounded-lg shadow-sm border border-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by product name or category..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-background border border-input rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'inStock' | 'outOfStock')}
                            className="w-full bg-background border border-input rounded-md py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="all">All Statuses</option>
                            <option value="inStock">In Stock</option>
                            <option value="outOfStock">Out of Stock</option>
                        </select>
                    </div>
                </div>
                {categoryFilter && (
                    <div className="mt-4">
                        <span className="text-sm font-medium text-muted-foreground">Filtered by category:</span>
                        <span className="ml-2 inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-semibold">
                            {categoryFilter}
                            <button onClick={onClearCategoryFilter} className="ml-1.5 text-primary hover:text-primary/80">
                                <XIcon className="h-4 w-4" />
                            </button>
                        </span>
                    </div>
                )}
            </div>

            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full min-w-[800px] text-sm text-left text-muted-foreground">
                        <thead className="text-xs text-foreground uppercase bg-muted">
                            <tr>
                                <th scope="col" className="px-4 py-3">Product Name</th>
                                <th scope="col" className="px-4 py-3">Category</th>
                                <th scope="col" className="px-4 py-3">Price Range</th>
                                <th scope="col" className="px-4 py-3 text-center">Stock</th>
                                <th scope="col" className="px-4 py-3 text-center">Status</th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => {
                                const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
                                const inStock = totalStock > 0;
                                return (
                                    <tr key={product.id} className="bg-card border-b border-border hover:bg-accent transition-colors duration-200">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            <div className="flex items-center space-x-3">
                                                <img src={product.imageUrls[0]} alt={product.name} className="h-10 w-10 object-cover rounded-md bg-muted" />
                                                <span>{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{product.category}</td>
                                        <td className="px-4 py-3">{getPriceRange(product.variants)}</td>
                                        <td className="px-4 py-3 text-center">{totalStock}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${inStock ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {inStock ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="relative inline-block text-left">
                                                <button onClick={() => setOpenActionMenu(openActionMenu === product.id ? null : product.id)} className="text-muted-foreground hover:text-foreground p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring">
                                                    <MoreVerticalIcon className="h-5 w-5" />
                                                </button>
                                                {openActionMenu === product.id && (
                                                    <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                        <div className="py-1">
                                                            <a href="#" onClick={(e) => { e.preventDefault(); openFormModal('edit', product); setOpenActionMenu(null); }} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Edit</a>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(product); }} className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Delete</a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                 {products.length === 0 && !isLoadingData && (
                    <div className="text-center py-16">
                        <p className="text-xl text-muted-foreground">No products found.</p>
                        <p className="text-md text-muted-foreground mt-2">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </>
    );
};
// FIX: Add default export to resolve module import error.
export default ProductManagement;