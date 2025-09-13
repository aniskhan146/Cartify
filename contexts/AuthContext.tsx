import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { createUserRoleAndProfile, getUserProfile } from '../services/databaseService';
import type { UserRoleInfo } from '../types';

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserRoleInfo | null;
    loading: boolean;
    signup: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    logout: () => Promise<{ error: AuthError | null }>;
    changePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserRoleInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUser(session?.user ?? null);
            if (session?.user) {
                const profile = await getUserProfile(session.user.id);
                setUserProfile(profile);
            }
            setLoading(false);
        };

        getInitialSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user ?? null;
            setCurrentUser(user);
            if (user) {
                let profile = await getUserProfile(user.id);
                // The profile is created here, after a session is confirmed.
                // This is the correct place for it.
                if (!profile) {
                    console.log(`User ${user.id} from Auth not found in DB. Creating profile now.`);
                    try {
                        await createUserRoleAndProfile(user.id, user.email!);
                        profile = await getUserProfile(user.id);
                    } catch (error) {
                        console.error("Failed to create user profile:", error);
                        // Handle failure, maybe log user out or show an error
                    }
                }
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            if(loading) setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [loading]);

    const signup = async (email: string, password: string) => {
        // FIX: Removed the call to createUserRoleAndProfile.
        // It caused an RLS error because it was called before the user session was active
        // (especially when email confirmation is enabled).
        // The onAuthStateChange listener now reliably handles profile creation.
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (data.user) {
            const profile = await getUserProfile(data.user.id);
            if (profile?.isBanned) {
                await supabase.auth.signOut();
                return { error: { message: "This account has been suspended.", name: 'BannedUserError' } as AuthError };
            }
        }
        return { error };
    };

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        // The onAuthStateChange listener will handle profile creation/checking
        return { error };
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const changePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        return { error };
    };
    
    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // URL to redirect to after password reset
        });
        return { error };
    };

    const value: AuthContextType = {
        currentUser,
        userProfile,
        loading,
        signup,
        login,
        signInWithGoogle,
        logout,
        changePassword,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
