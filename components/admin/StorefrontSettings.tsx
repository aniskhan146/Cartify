import React, { useState, useEffect } from 'react';
import { onHeroImagesChange, saveHeroImages, onCheckoutConfigChange, saveCheckoutConfig } from '../../services/databaseService';
import { Trash2Icon, UploadIcon } from '../shared/icons';
import type { CheckoutConfig } from '../../types';

const StorefrontSettings: React.FC = () => {
    const [heroImages, setHeroImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [checkoutConfig, setCheckoutConfig] = useState<CheckoutConfig>({ shippingCharge: 0, taxAmount: 0 });
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [isConfigSaving, setIsConfigSaving] = useState(false);
    const [configError, setConfigError] = useState('');
    const [configSuccess, setConfigSuccess] = useState('');

    useEffect(() => {
        const unsubscribeHero = onHeroImagesChange((images) => {
            setHeroImages(images);
            setIsLoading(false);
        });
        const unsubscribeConfig = onCheckoutConfigChange((config) => {
            setCheckoutConfig(config);
            setIsConfigLoading(false);
        });
        return () => {
            unsubscribeHero();
            unsubscribeConfig();
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setError('');

        const imagePromises = Array.from(files).map(file => {
            return new Promise<string>((resolve, reject) => {
                if (!file.type.startsWith('image/')) {
                    return reject(new Error(`File "${file.name}" is not a valid image.`));
                }
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    return reject(new Error(`File "${file.name}" is too large (max 5MB).`));
                }

                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises)
            .then(base64Images => {
                setHeroImages(prev => [...prev, ...base64Images]);
            })
            .catch(err => {
                setError(err.message || 'An error occurred during file upload.');
            })
            .finally(() => {
                setIsUploading(false);
                if (e.target) e.target.value = '';
            });
    };

    const handleAddImage = () => {
        if (newImageUrl && !heroImages.includes(newImageUrl)) {
            try {
                // Basic URL structure validation is sufficient.
                // The browser can handle various image links if the server provides the correct MIME type.
                new URL(newImageUrl);
                setHeroImages([...heroImages, newImageUrl]);
                setNewImageUrl('');
                setError('');
            } catch (_) {
                setError('Please enter a valid image URL.');
            }
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setHeroImages(heroImages.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await saveHeroImages(heroImages);
            setSuccess('Hero images updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfigError('');
        setCheckoutConfig(prev => ({
            ...prev,
            [name]: value === '' ? 0 : Number(value)
        }));
    };

    const handleSaveConfig = async () => {
        setIsConfigSaving(true);
        setConfigError('');
        setConfigSuccess('');
        try {
            if (Number(checkoutConfig.shippingCharge) < 0 || Number(checkoutConfig.taxAmount) < 0) {
                throw new Error("Values cannot be negative.");
            }
            await saveCheckoutConfig({
                shippingCharge: Number(checkoutConfig.shippingCharge),
                taxAmount: Number(checkoutConfig.taxAmount)
            });
            setConfigSuccess('Checkout settings updated successfully!');
            setTimeout(() => setConfigSuccess(''), 3000);
        } catch (err) {
            setConfigError(err instanceof Error ? err.message : 'Failed to save checkout settings.');
        } finally {
            setIsConfigSaving(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-6">Storefront Settings</h1>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border mb-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Hero Section 3D Image Ring</h2>
                <p className="text-sm text-muted-foreground mb-4">Manage the images that appear in the 3D rotating ring on your homepage. Upload images directly or add URLs. Changes will be reflected live on the storefront.</p>

                {isLoading ? (
                    <div className="flex justify-center items-center py-8"><div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label htmlFor="imageUpload" className="relative block w-full p-6 border-2 border-dashed border-border rounded-lg text-center cursor-pointer hover:border-primary hover:bg-accent transition-colors">
                                {isUploading ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                                        <span className="mt-2 text-sm text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center">
                                        <UploadIcon className="h-8 w-8 text-muted-foreground" />
                                        <span className="mt-2 text-sm font-medium text-foreground">Click to upload or drag and drop</span>
                                        <span className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</span>
                                    </div>
                                )}
                                <input
                                    id="imageUpload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        
                        <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase">Or</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="newImageUrl" className="block text-sm font-medium text-muted-foreground mb-1">Add Image by URL</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="newImageUrl"
                                    type="text"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.png"
                                    className="flex-grow p-2 border border-input rounded-md bg-background"
                                />
                                <button onClick={handleAddImage} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">Add</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[100px]">
                            {heroImages.map((url, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={url} alt={`Hero Image ${index + 1}`} className="w-full h-full object-cover rounded-md bg-muted" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => handleRemoveImage(index)} className="text-white bg-red-600/80 rounded-full p-2 hover:bg-red-600">
                                            <Trash2Icon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-8 flex items-center justify-end space-x-4 border-t border-border pt-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border border-border mt-6">
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-3">Checkout Settings</h2>
                <p className="text-sm text-muted-foreground mb-4">Set the shipping and tax amounts that will be applied to all orders during checkout.</p>
                {isConfigLoading ? (
                    <div className="flex justify-center items-center py-8"><div className="w-8 h-8 border-4 border-t-transparent border-primary rounded-full animate-spin"></div></div>
                ) : (
                    <div className="max-w-md space-y-4">
                        <div>
                            <label htmlFor="shippingCharge" className="block text-sm font-medium text-muted-foreground mb-1">Shipping Charge (৳)</label>
                            <input
                                id="shippingCharge"
                                name="shippingCharge"
                                type="number"
                                value={checkoutConfig.shippingCharge}
                                onChange={handleConfigChange}
                                placeholder="e.g., 40"
                                min="0"
                                className="w-full p-2 border border-input rounded-md bg-background"
                            />
                        </div>
                        <div>
                            <label htmlFor="taxAmount" className="block text-sm font-medium text-muted-foreground mb-1">Fixed Tax Amount (৳)</label>
                            <input
                                id="taxAmount"
                                name="taxAmount"
                                type="number"
                                value={checkoutConfig.taxAmount}
                                onChange={handleConfigChange}
                                placeholder="e.g., 4"
                                min="0"
                                className="w-full p-2 border border-input rounded-md bg-background"
                            />
                        </div>
                    </div>
                )}
                 <div className="mt-8 flex items-center justify-end space-x-4 border-t border-border pt-4">
                    {configError && <p className="text-sm text-destructive">{configError}</p>}
                    {configSuccess && <p className="text-sm text-green-600">{configSuccess}</p>}
                    <button
                        onClick={handleSaveConfig}
                        disabled={isConfigSaving || isConfigLoading}
                        className="bg-primary text-primary-foreground py-2 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                        {isConfigSaving ? 'Saving...' : 'Save Checkout Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StorefrontSettings;