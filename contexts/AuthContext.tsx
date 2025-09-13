import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { createUserRoleAndProfile, getUserProfile, updateUserProfileData } from '../services/databaseService';
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
    updateProfile: (data: { displayName: string }) => Promise<{ error: AuthError | null }>;
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
                if (!profile) {
                    console.log(`User ${user.id} from Auth not found in DB. Creating profile now.`);
                    try {
                        const displayName = user.user_metadata.full_name || user.email?.split('@')[0];
                        await createUserRoleAndProfile(user.id, user.email!, displayName);
                        profile = await getUserProfile(user.id);
                    } catch (error) {
                        console.error("Failed to create user profile:", error);
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
            redirectTo: window.location.origin,
        });
        return { error };
    };

    const updateProfile = async (data: { displayName: string }) => {
        if (!currentUser) return { error: { message: "No user logged in", name: "AuthError" } as AuthError };

        // 1. Update Supabase Auth user_metadata
        const { error: authError } = await supabase.auth.updateUser({ data: { displayName: data.displayName } });
        if (authError) return { error: authError };

        // 2. Update public profiles table
        try {
            await updateUserProfileData(currentUser.id, data);
        } catch (dbError: any) {
            return { error: { message: dbError.message, name: "DatabaseError" } as AuthError };
        }
        
        // 3. Refresh local profile state
        const updatedProfile = await getUserProfile(currentUser.id);
        setUserProfile(updatedProfile);

        return { error: null };
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
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};