import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminForgotPasswordModalProps {
    onClose: () => void;
}

const AdminForgotPasswordModal: React.FC<AdminForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess('If an account with this email exists, a password reset link has been sent.');
            setEmail('');
        } catch (err: any) {
             setError('Failed to send password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-sm relative border border-border" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-4 text-2xl font-light text-muted-foreground hover:text-foreground">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-foreground">Reset Admin Password</h2>
                
                {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
                {success && <p className="bg-green-100 text-green-800 text-sm p-3 rounded-md mb-4 text-center">{success}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">Enter your email address and we'll send you a link to reset your password.</p>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button type="submit" disabled={loading || !!success} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                 <p className="text-center text-sm text-muted-foreground mt-6">
                    Remember your password?{' '}
                    <button onClick={onClose} className="font-semibold text-primary hover:underline">
                        Back to Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AdminForgotPasswordModal;