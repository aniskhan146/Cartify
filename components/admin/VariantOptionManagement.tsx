import React, { useState, useEffect, useRef } from 'react';
import { MoreVerticalIcon, XIcon, PlusIcon } from '../shared/icons';
import { onVariantOptionsChange, saveVariantOption, deleteVariantOption } from '../../services/databaseService';
import ConfirmationModal from './ConfirmationModal';
import type { VariantOption, VariantOptionValue } from '../../types';
import { cn } from '../../lib/utils';
import { getHexCodeForColorName } from '../../services/geminiService';
import { useNotification } from '../../contexts/NotificationContext';

const isColorOption = (name: string) => name.toLowerCase().includes('color');

const VariantOptionManagement: React.FC = () => {
    const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentOption, setCurrentOption] = useState<VariantOption | null>(null);
    const [optionToDelete, setOptionToDelete] = useState<VariantOption | null>(null);
    const [formData, setFormData] = useState<Omit<VariantOption, 'id'>>({ name: '', values: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    
    // State for new value input
    const [newValueName, setNewValueName] = useState('');
    const [newValueColor, setNewValueColor] = useState('#000000');
    const [isSuggestingColor, setIsSuggestingColor] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);
    const { addNotification } = useNotification();


    useEffect(() => {
        const unsubscribe = onVariantOptionsChange((options) => {
            setVariantOptions(options);
            setIsLoadingData(false);
        });
        return () => {
             unsubscribe();
             if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        }
    }, []);

    const closeModal = () => {
        setIsFormModalOpen(false);
        setIsConfirmModalOpen(false);
        setCurrentOption(null);
        setOptionToDelete(null);
        setError('');
        setFormData({ name: '', values: [] });
        setNewValueName('');
        setNewValueColor('#000000');
    };

    const openFormModal = (mode: 'add' | 'edit', option: VariantOption | null = null) => {
        setModalMode(mode);
        setCurrentOption(option);
        if (mode === 'edit' && option) {
            setFormData({ name: option.name, values: option.values || [] });
        }
        setIsFormModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleDeleteClick = (option: VariantOption) => {
        setOptionToDelete(option);
        setIsConfirmModalOpen(true);
        setOpenActionMenu(null);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Option name is required.');
            return;
        }
        if (formData.values.length === 0) {
            setError('Please add at least one value for this option.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            await saveVariantOption(formData, currentOption?.id);
            setIsLoading(false);
            closeModal();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save option');
            setIsLoading(false);
        }
    };
    
    const handleAddValue = () => {
        const trimmedName = newValueName.trim();
        if (trimmedName && !formData.values.some(v => v.name.toLowerCase() === trimmedName.toLowerCase())) {
            const newEntry: VariantOptionValue = { name: trimmedName };
            if (isColorOption(formData.name)) {
                newEntry.colorCode = newValueColor;
            }
            setFormData(prev => ({...prev, values: [...prev.values, newEntry]}));
            setNewValueName('');
            setNewValueColor('#000000');
        }
    };

    const handleRemoveValue = (valueToRemove: string) => {
        setFormData(prev => ({...prev, values: prev.values.filter(v => v.name !== valueToRemove)}));
    };
    
    const handleNewValueNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setNewValueName(name);

        // Clear any existing timer
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // If it's not a color option or the input is empty, do nothing.
        if (!isColorOption(formData.name) || !name.trim()) {
            setIsSuggestingColor(false);
            return;
        }

        // Check if the input is a valid hex code
        const hexRegex = /^#([0-9a-fA-F]{6})$/;
        if (hexRegex.test(name)) {
            setIsSuggestingColor(false);
            setNewValueColor(name);
            return; // It's a valid hex, update color directly and stop.
        }
        
        // If it's not a hex code, start the debounce for AI suggestion
        setIsSuggestingColor(true);
        debounceTimeoutRef.current = window.setTimeout(async () => {
            try {
                const hex = await getHexCodeForColorName(name);
                setNewValueColor(hex);
            } catch (error) {
                console.error("Failed to get AI color suggestion", error);
                // Optionally, you can set an error state here to inform the user
            } finally {
                setIsSuggestingColor(false);
            }
        }, 500); // 500ms debounce
    };

    const handleConfirmDelete = async () => {
        if (!optionToDelete) return;
        setIsLoading(true);
        try {
            await deleteVariantOption(optionToDelete.id);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to delete option', 'error');
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };
    
    const renderModalContent = () => {
         const isColor = isColorOption(formData.name);
         return (
            <form onSubmit={handleFormSubmit}>
                <h2 className="text-xl font-bold mb-6">{modalMode === 'add' ? 'Add New Variant Option' : 'Edit Variant Option'}</h2>
                {error && <p className="text-red-500 text-sm mb-4 p-2 bg-red-500/10 rounded-md">{error}</p>}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="optionName" className="block text-sm font-medium text-muted-foreground mb-1">Option Name</label>
                        <input
                            id="optionName"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 border border-input rounded-md bg-background"
                            placeholder="e.g., Color, Size, Material"
                        />
                    </div>
                    <div>
                        <label htmlFor="optionValues" className="block text-sm font-medium text-muted-foreground mb-1">Option Values</label>
                        <div className="flex items-center space-x-2">
                            {isColor && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    <input
                                        type="color"
                                        value={newValueColor}
                                        onChange={(e) => {
                                            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
                                            setIsSuggestingColor(false);
                                            setNewValueColor(e.target.value);
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-full h-full rounded-md border border-input flex items-center justify-center" style={{ backgroundColor: newValueColor }}>
                                         {isSuggestingColor && (
                                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <input
                                id="optionValues"
                                type="text"
                                value={newValueName}
                                onChange={handleNewValueNameChange}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddValue(); }}}
                                className="flex-grow p-2 border border-input rounded-md bg-background"
                                placeholder={isColor ? "Type a name (e.g., Forest Green) or paste a hex code" : "Add a new value and press Enter"}
                            />
                            <button type="button" onClick={handleAddValue} className="bg-primary text-primary-foreground p-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                                <PlusIcon className="h-5 w-5"/>
                            </button>
                        </div>
                        {isColor && <p className="text-xs text-muted-foreground mt-2">Tip: Pasting a hex code (e.g., #228B22) will update the color instantly. For descriptive names, our AI will suggest a color.</p>}
                        <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-input bg-background p-2">
                            {formData.values.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {formData.values.map(val => (
                                        <span key={val.name} className="inline-flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm font-medium">
                                            {val.colorCode && (
                                                <span className="w-4 h-4 rounded-full mr-2 border border-border" style={{backgroundColor: val.colorCode}}></span>
                                            )}
                                            {val.name}
                                            <button type="button" onClick={() => handleRemoveValue(val.name)} className="ml-1.5 text-secondary-foreground hover:text-foreground">
                                                <XIcon className="h-4 w-4"/>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-xs text-muted-foreground py-2">No values added yet.</p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-3 border-t border-border pt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg font-semibold bg-secondary text-secondary-foreground hover:bg-accent transition-colors">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors">
                        {isLoading ? 'Saving...' : 'Save Option'}
                    </button>
                </div>
            </form>
        );
    };

    return (
        <>
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={closeModal}
                onConfirm={handleConfirmDelete}
                title="Delete Variant Option"
                message={`Are you sure you want to delete the option "${optionToDelete?.name}"? This could affect products currently using this option. This action cannot be undone.`}
                isLoading={isLoading}
            />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Variant Options</h1>
                <button onClick={() => openFormModal('add')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm">
                    Add Option
                </button>
            </div>
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-x-auto">
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                <table className="w-full min-w-[600px] text-sm text-left text-muted-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                        <tr>
                            <th scope="col" className="px-4 py-3">Option Name</th>
                            <th scope="col" className="px-4 py-3">Values</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {variantOptions.map(option => (
                            <tr key={option.id} className="bg-card border-b border-border hover:bg-accent transition-colors duration-200">
                                <td className="px-4 py-3 font-medium text-foreground">{option.name}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 max-w-md">
                                        {(option.values || []).map(val => (
                                            <span key={val.name} className="flex items-center bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                                                 {val.colorCode && <span className="w-2.5 h-2.5 rounded-full mr-1.5 border border-border" style={{backgroundColor: val.colorCode}} />}
                                                {val.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="relative inline-block text-left">
                                        <button onClick={() => setOpenActionMenu(openActionMenu === option.id ? null : option.id)} className="text-muted-foreground hover:text-foreground p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-ring">
                                            <MoreVerticalIcon className="h-5 w-5" />
                                        </button>
                                        {openActionMenu === option.id && (
                                            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card ring-1 ring-border z-10">
                                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); openFormModal('edit', option); }} className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground" role="menuitem">Edit</a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDeleteClick(option); }} className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10" role="menuitem">Delete</a>
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

export default VariantOptionManagement;