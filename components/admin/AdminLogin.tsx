import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/databaseService';
import { supabase } from '../../services/supabaseClient';
import AdminForgotPasswordModal from './AdminForgotPasswordModal';

interface AdminLoginProps {
    onLoginSuccess: () => void;
    onSwitchToUser: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onSwitchToUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, logout } = useAuth();
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { error: loginError } = await login(email, password);

            if (loginError) {
                if (loginError.message.includes("Invalid login credentials")) {
                    throw new Error("Invalid email or password. Please check your credentials.");
                }
                if (loginError.message.includes("suspended")) {
                     throw new Error(loginError.message);
                }
                throw loginError;
            }
            
            // onAuthStateChange in AuthContext handles setting the user. We just need to check the profile.
            // A small delay to allow onAuthStateChange to fire and update the context.
            setTimeout(async () => {
                // FIX: supabase was not defined, imported it.
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profile = await getUserProfile(user.id);
                    if (profile?.isBanned) {
                        await logout();
                        setError("This account has been suspended.");
                    } else if (profile?.role === 'admin') {
                        onLoginSuccess();
                    } else {
                        await logout();
                        setError("Access Denied. You do not have administrative privileges.");
                    }
                } else {
                    // This case should ideally not be hit if login was successful
                    setError("Failed to verify user session. Please try again.");
                }
                setLoading(false);
            }, 500);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during login.');
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
                 <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-foreground">AYExpress</h1>
                        <p className="text-muted-foreground mt-2">Admin Panel</p>
                    </div>
                    <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
                        <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Administrator Login</h2>
                        
                        {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPasswordModalOpen(true)}
                                    className="text-sm text-primary hover:underline font-medium"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                                {loading ? 'Authenticating...' : 'Login'}
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Not an admin?{' '}
                        <button onClick={onSwitchToUser} className="font-semibold text-primary hover:underline">
                            Go to Storefront
                        </button>
                    </p>
                 </div>
            </div>
            {isForgotPasswordModalOpen && (
                <AdminForgotPasswordModal onClose={() => setIsForgotPasswordModalOpen(false)} />
            )}
        </>
    );
};

export default AdminLogin;
