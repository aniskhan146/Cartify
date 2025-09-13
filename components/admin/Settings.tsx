import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
    const { changePassword } = useAuth();
    // FIX: Removed currentPassword from state as it's not used by the changePassword function.
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (formData.newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);
        try {
            // FIX: Corrected the call to `changePassword` to pass only one argument as defined in AuthContext.
            const { error: changePasswordError } = await changePassword(formData.newPassword);
            if (changePasswordError) {
                throw changePasswordError;
            }
            setSuccess("Password updated successfully!");
            // FIX: Updated state clearing to match the new form state.
            setFormData({ newPassword: '', confirmPassword: '' }); // Clear form
        } catch (err: any) {
            // FIX: Updated error handling to be more generic as the previous check was incorrect for the implemented function.
            let message = err.message || "Failed to update password.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>

            <div className="max-w-lg mx-auto bg-card p-8 rounded-lg shadow-sm border border-border">
                <h2 className="text-xl font-semibold text-foreground mb-6 border-b border-border pb-4">Change Password</h2>

                {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">{error}</p>}
                {success && <p className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-4">{success}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* FIX: Removed the "Current Password" input field as it was not being used in the password change logic, preventing user confusion. */}
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-1">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Settings;