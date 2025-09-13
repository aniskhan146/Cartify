import React, { useState, useEffect, useRef } from 'react';
import { MoreVerticalIcon } from '../shared/icons';
import { onCategoriesValueChange, saveCategory, deleteCategory } from '../../services/databaseService';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';

type DisplayCategory = {
    id: string;
    name: string;
    iconUrl: string;
    productCount: number;
};

interface CategoryManagementProps {
    onViewCategoryProducts: (categoryName: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onViewCategoryProducts }) => {
    const [categories, setCategories] = useState<DisplayCategory[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentCategory, setCurrentCategory] = useState<DisplayCategory | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<DisplayCategory | null>(null);
    const [formData, setFormData] = useState({ name: '', iconUrl: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addNotification } = useNotification();


    useEffect(() => {
        const unsubscribe = onCategoriesValueChange((dbCategories) => {
            const mapped = dbCategories.map(c => ({
                ...c,
            }));
            setCategories(mapped);
            setIsLoadingData(false);
        });
        return () => unsubscribe();
    }, []);

    const closeModal = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setCurrentCategory(null);
        setCategoryToDelete(null);
        setError('');
        setFormData({ name: '', iconUrl: '' });
    };

    const openFormModal = (mode: 'add' | 'edit', category: DisplayCategory | null = null) => {
        setModalMode(mode);
        setCurrentCategory(category);
        if (mode === 'edit' && category) {
            setFormData({ name: category.name, iconUrl: category.iconUrl });
        }
        setIsFormModalOpen(true);
        setOpenActionMenu(null);
    };
    
    const handleDeleteClick = (category: DisplayCategory) => {
        setCategoryToDelete(category);
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, iconUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError('Category name is required.');
            return;
        }
        if (!formData.iconUrl) {
            setError('Category icon is required.');
            return;
        }
        setIsLoading(true);
        setError('');
        
        const categoryData = {
            name: formData.name,
            iconUrl: formData.iconUrl,
            productCount: currentCategory?.productCount || 0,
        };

        try {
            await saveCategory(categoryData, currentCategory?.id);
            setIsLoading(false);
            closeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save category');
            setIsLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        setIsLoading(true);
        try {
            await deleteCategory(categoryToDelete.id);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to delete category', 'error');
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };

    const renderModalContent = () => (
        <form onSubmit={handleFormSubmit}>
            <h2 className="text-xl font-bold mb-6">{modalMode === 'add' ? 'Add New Category' : 'Edit Category'}</h2>
            {error && <p className="text-red-500 text-sm mb-4 p-2 bg-red-500/10 rounded-md">{error}</p>}
            <div className="space-y-4">
                <div>
                    <label htmlFor="categoryName" className="block text-sm font-medium text-muted-foreground mb-1">Category Name</label>
                    <input
                        id="categoryName"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="e.g., Health & Wellness"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-muted-foreground mb-2">Icon</label>
                     <div className="flex items-center space-x-4">
                         <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden">
                             {formData.iconUrl ? (
                                 <img src={formData.iconUrl} alt="Icon Preview" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                             ) : (
                                 <span className="text-xs text-center text-muted-foreground">No Icon</span>
                             )}
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleIconChange} accept="image/*" className="hidden" />
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">
                             Upload Icon
                         </button>
                     </div>
                 </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 border-t border-border pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">
                    {isLoading ? 'Saving...' : 'Save Category'}
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
                title="Delete Category"
                message={`Are you sure you want to delete the category "${categoryToDelete?.name}"? This action cannot be undone.`}
                isLoading={isLoading}
            />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                <button onClick={() => openFormModal('add')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">
                    Add Category
                </button>
            </div>
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                <table className="w-full min-w-[600px] text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                        <tr>
                            <th scope="col" className="px-4 py-3">Category Name</th>
                            <th scope="col" className="px-4 py-3">Products</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr key={category.id} className="bg-card border-b border-border hover:bg-accent transition-colors duration-200">
                                <td className="px-4 py-3 font-medium text-foreground">
                                    <div className="flex items-center space-x-3">
                                        <img src={category.iconUrl} alt={category.name} loading="lazy" decoding="async" className="h-8 w-8 object-contain rounded-md" />
                                        <span>{category.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <button onClick={() => onViewCategoryProducts(category.name)} className="font-medium text-primary hover:underline transition-colors">
                                        {category.productCount}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="relative inline-block text-left">
                                        <button onClick={() => setOpenActionMenu(openActionMenu === category.id ? null : category.id)} className="text-muted-foreground hover:text-foreground p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring">
                                            <MoreVerticalIcon className="h-5 w-5" />
                                        </button>
                                        {openActionMenu === category.id && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); openFormModal('edit', category); }} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground" role="menuitem">Edit</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(category); }} className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10" role="menuitem">Delete</a>
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

export default CategoryManagement;