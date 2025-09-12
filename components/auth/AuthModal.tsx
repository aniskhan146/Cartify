import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
    onClose: () => void;
}

const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48">
        <path d="M480 671q-21-1-35.5-15.5T430 621V427h-80v-60h80v-77q0-55 28.5-85t86.5-30q41 0 65 3.5v52.5h-39q-22 0-31 9t-9 28v69h72l-10 60h-62v194q0 22-14.5 36.5T480 671Zm0 321q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T20 631q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480 271q53 0 100 13.5t86 41.5V230q0-38 26-64t64-26q37 0 63.5 26t26.5 64v610q0 38-26.5 64T756 991q-38 0-64-26t-26-64v-96q-39 28-86 41.5T480 992Zm0-60q142 0 241-99.5T820 631q0-142-99-241.5T480 291q-141 0-240.5 99T140 631q0 141 99.5 240.5T480 932Z" fill="currentColor" />
    </svg>
);


const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, login, signInWithGoogle, resetPassword } = useAuth();

    const handleViewChange = (newView: 'login' | 'signup' | 'reset') => {
        setError('');
        setSuccess('');
        setPassword('');
        setConfirmPassword('');
        setView(newView);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (view === 'signup' && password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            if (view === 'login') {
                await login(email, password);
            } else if (view === 'signup') {
                await signup(email, password);
            }
            onClose();
        } catch (err: any) {
            let message = 'Failed to authenticate. Please try again.';
            if (err.message === "This account has been suspended.") {
                message = err.message;
            } else {
                switch (err.code) {
                    case 'auth/invalid-email':
                        message = 'Please enter a valid email address.';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        message = 'Invalid email or password. Please check your credentials and try again.';
                        break;
                    case 'auth/email-already-in-use':
                        message = 'An account with this email already exists. Please try logging in.';
                        break;
                    case 'auth/weak-password':
                        message = 'Password is too weak. It should be at least 6 characters long.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Access to this account has been temporarily disabled due to too many failed attempts. Please try again later.';
                        break;
                    default:
                        console.error("Authentication error:", err);
                        break;
                }
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess("If an account with this email exists, a password reset link has been sent. Please check your inbox.");
        } catch (err: any) {
            setError("Failed to send reset link. Please check the email address and try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            let message = 'Failed to sign in with Google. Please try again.';
            if (err.message === "This account has been suspended.") {
                message = err.message;
            } else {
                switch (err.code) {
                    case 'auth/popup-closed-by-user':
                    case 'auth/cancelled-popup-request':
                        message = '';
                        break;
                    case 'auth/operation-not-supported-in-this-environment':
                        message = 'Google Sign-In is not supported in this browser environment. Please try standard login with email and password.';
                        break;
                    case 'auth/popup-blocked-by-browser':
                        message = 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
                        break;
                    case 'auth/unauthorized-domain':
                        message = 'This domain is not authorized for Google Sign-In. Please contact the site administrator.';
                        break;
                    case 'auth/operation-not-allowed':
                        message = 'Google Sign-In is not enabled for this app. Please contact the site administrator.';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        message = 'An account with this email already exists using a different sign-in method (e.g., password).';
                        break;
                    default:
                        console.error("Google Sign-In error:", err);
                        break;
                }
            }


            if (message) {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100] modal-backdrop" onClick={onClose}>
            <div className="bg-card rounded-lg shadow-xl p-8 w-full max-w-sm relative border border-border modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-4 text-2xl font-light text-muted-foreground hover:text-foreground">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-2 text-foreground">
                    {view === 'login' && 'Welcome Back'}
                    {view === 'signup' && 'Create Account'}
                    {view === 'reset' && 'Reset Password'}
                </h2>
                <p className="text-center text-muted-foreground mb-6 text-sm">
                    {view === 'login' && 'Sign in to continue'}
                    {view === 'signup' && 'Get started with Cartify'}
                    {view === 'reset' && 'Enter your email to receive a reset link'}
                </p>
                
                {error && <p className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4 text-center">{error}</p>}
                {success && <p className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md mb-4 text-center">{success}</p>}

                {view === 'reset' ? (
                     <form onSubmit={handleResetPassword} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button type="submit" disabled={loading || !!success} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <>
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center px-4 py-2.5 border border-input rounded-md bg-background hover:bg-accent font-semibold text-foreground transition-colors disabled:opacity-70"
                            >
                                <GoogleIcon className="h-5 w-5 mr-3" />
                                Continue with Google
                            </button>
                            <div className="flex items-center">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="mx-4 text-xs text-muted-foreground uppercase">Or</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>
                        </div>
                        
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
                            {view === 'signup' && (
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            )}
                            {view === 'login' && (
                                <div className="text-right">
                                    <button type="button" onClick={() => handleViewChange('reset')} className="text-sm text-primary hover:underline font-medium">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70">
                                {loading ? 'Processing...' : (view === 'login' ? 'Login' : 'Sign Up')}
                            </button>
                        </form>
                    </>
                )}
                
                <p className="text-center text-sm text-muted-foreground mt-6">
                    {view === 'login' && "Don't have an account?"}
                    {view === 'signup' && "Already have an account?"}
                    {view === 'reset' && "Remember your password?"}
                    <button onClick={() => handleViewChange(view === 'login' ? 'signup' : 'login')} className="font-semibold text-primary hover:underline ml-1">
                        {view === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;