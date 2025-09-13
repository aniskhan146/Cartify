import React, { useState, useEffect, useRef } from 'react';
import { MoreVerticalIcon, XIcon, PlusIcon } from '../shared/icons';
import { onBrandsChange, saveBrand, deleteBrand } from '../../services/databaseService';
import ConfirmationModal from './ConfirmationModal';
import type { Brand } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';

const BrandManagement: React.FC = () => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
    const [formData, setFormData] = useState<Omit<Brand, 'id'>>({ name: '', logoUrl: '', isFeatured: false });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();

    useEffect(() => {
        const unsubscribe = onBrandsChange((dbBrands) => {
            setBrands(dbBrands);
            setIsLoadingData(false);
        });
        return () => unsubscribe();
    }, []);

    const closeModal = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setCurrentBrand(null);
        setBrandToDelete(null);
        setError('');
        setFormData({ name: '', logoUrl: '', isFeatured: false });
    };

    const openFormModal = (mode: 'add' | 'edit', brand: Brand | null = null) => {
        setModalMode(mode);
        setCurrentBrand(brand);
        if (mode === 'edit' && brand) {
            setFormData({ name: brand.name, logoUrl: brand.logoUrl, isFeatured: brand.isFeatured });
        }
        setIsFormModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleDeleteClick = (brand: Brand) => {
        setBrandToDelete(brand);
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Brand name is required.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            await saveBrand(formData, currentBrand?.id);
            addNotification(`Brand "${formData.name}" saved successfully.`, 'success');
            setIsLoading(false);
            closeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save brand');
            setIsLoading(false);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!brandToDelete) return;
        setIsLoading(true);
        try {
            await deleteBrand(brandToDelete.id);
            addNotification(`Brand "${brandToDelete.name}" deleted.`, 'success');
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to delete brand.', 'error');
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };
    
    const renderModalContent = () => (
        <form onSubmit={handleFormSubmit}>
            <h2 className="text-xl font-bold mb-6">{modalMode === 'add' ? 'Add New Brand' : 'Edit Brand'}</h2>
            {error && <p className="text-red-500 text-sm mb-4 p-2 bg-red-500/10 rounded-md">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label htmlFor="brandName" className="block text-sm font-medium text-muted-foreground mb-1">Brand Name</label>
                    <input
                        id="brandName"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="e.g., AYExpress Originals"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-muted-foreground mb-2">Logo</label>
                     <div className="flex items-center space-x-4">
                         <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden">
                             {formData.logoUrl ? (
                                 <img src={formData.logoUrl} alt="Logo Preview" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                             ) : (
                                 <span className="text-xs text-center text-muted-foreground">No Logo</span>
                             )}
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">
                             Upload Logo
                         </button>
                     </div>
                 </div>
                 <div className="flex items-center pt-2">
                    <input
                        id="isFeatured"
                        type="checkbox"
                        checked={!!formData.isFeatured}
                        onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                        className="h-4 w-4 rounded bg-secondary border-input text-primary focus:ring-primary"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-muted-foreground">
                        Feature this brand on the homepage ("Shopee Mall")
                    </label>
                 </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 border-t border-border pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">
                    {isLoading ? 'Saving...' : 'Save Brand'}
                </button>
            </div>
        </form>
    );

    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={closeModal}
                onConfirm={handleConfirmDelete}
                title="Delete Brand"
                message={`Are you sure you want to delete the brand "${brandToDelete?.name}"? This might affect products linked to it.`}
                isLoading={isLoading}
            />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Brands</h1>
                <button onClick={() => openFormModal('add')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">
                    Add Brand
                </button>
            </div>
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                <table className="w-full min-w-[600px] text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                        <tr>
                            <th scope="col" className="px-4 py-3">Brand Name</th>
                            <th scope="col" className="px-4 py-3">Featured</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map(brand => (
                            <tr key={brand.id} className="bg-card border-b border-border hover:bg-accent transition-colors duration-200">
                                <td className="px-4 py-3 font-medium text-foreground">
                                    <div className="flex items-center space-x-3">
                                        <img src={brand.logoUrl} alt={brand.name} loading="lazy" decoding="async" className="h-8 w-8 object-contain rounded-md bg-white p-1" />
                                        <span>{brand.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {brand.isFeatured ? (
                                        <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Yes</span>
                                     ) : (
                                        <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">No</span>
                                     )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="relative inline-block text-left">
                                        <button onClick={() => setOpenActionMenu(openActionMenu === brand.id ? null : brand.id)} className="text-muted-foreground hover:text-foreground p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring">
                                            <MoreVerticalIcon className="h-5 w-5" />
                                        </button>
                                        {openActionMenu === brand.id && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                <div className="py-1">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); openFormModal('edit', brand); }} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">Edit</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(brand); }} className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10">Delete</a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
            {isFormModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop" onClick={closeModal}>
                    <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg modal-content border border-border" onClick={e => e.stopPropagation()}>
                        {renderModalContent()}
                    </div>
                </div>
            )}
        </>
    );
};

export default BrandManagement;