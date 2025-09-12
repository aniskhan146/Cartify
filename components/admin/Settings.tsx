import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
    const { changePassword } = useAuth();
    const [formData, setFormData] = useState({
        currentPassword: '',
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
            await changePassword(formData.currentPassword, formData.newPassword);
            setSuccess("Password updated successfully!");
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear form
        } catch (err: any) {
            let message = "Failed to update password.";
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                message = "The current password you entered is incorrect.";
            }
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
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-muted-foreground mb-1">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            required
                            className="w-full p-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
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