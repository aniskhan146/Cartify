import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// FIX: Switched to Firebase v8 compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth, googleProvider } from '../services/firebase';
import { createUserRoleAndProfile, getUserProfile } from '../services/databaseService';
import type { UserRole, UserRoleInfo } from '../types';

// FIX: Defined User type from firebase namespace for v8 compat.
type User = firebase.User;

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserRoleInfo | null;
    loading: boolean;
    // FIX: Updated return types for v8 compat.
    signup: (email: string, password: string) => Promise<firebase.auth.UserCredential>;
    login: (email: string, password: string) => Promise<firebase.auth.UserCredential>;
    signInWithGoogle: () => Promise<firebase.auth.UserCredential>;
    logout: () => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
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
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setCurrentUser(user);
            if (user) {
                // Check for an existing profile. If it doesn't exist, create one.
                // This ensures that any user in Firebase Auth gets an entry in the Realtime Database upon logging in.
                let profile = await getUserProfile(user.uid);
                if (!profile) {
                    console.log(`User ${user.uid} from Auth not found in DB. Creating profile now.`);
                    await createUserRoleAndProfile(user.uid, user.email!);
                    // Re-fetch the profile after creating it.
                    profile = await getUserProfile(user.uid);
                }
                setUserProfile(profile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    const signup = async (email: string, password: string) => {
        // FIX: Used auth service method `createUserWithEmailAndPassword` for v8 compat.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (userCredential.user) {
            // The role assignment logic is now handled in the database service
            await createUserRoleAndProfile(userCredential.user.uid, email);
        }
        return userCredential;
    };

    const login = async (email: string, password: string) => {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (userCredential.user) {
            const profile = await getUserProfile(userCredential.user.uid);
            if (profile?.isBanned) {
                await auth.signOut(); // Log them out immediately
                throw new Error("This account has been suspended.");
            }
        }
        return userCredential;
    };

    const signInWithGoogle = async () => {
        const userCredential = await auth.signInWithPopup(googleProvider);
        if (userCredential.user) {
            // Check for profile regardless of whether the user is new.
            let profile = await getUserProfile(userCredential.user.uid);

            // If no profile exists, create one. This handles new users and existing-but-unsynced users.
            if (!profile) {
                await createUserRoleAndProfile(userCredential.user.uid, userCredential.user.email!);
                profile = await getUserProfile(userCredential.user.uid); // Re-fetch
            }
            
            // Now we can safely check the ban status.
            if (profile?.isBanned) {
                await auth.signOut();
                throw new Error("This account has been suspended.");
            }
        }
        return userCredential;
    };


    const logout = () => {
        setUserProfile(null);
        // FIX: Used auth service method `signOut` for v8 compat.
        return auth.signOut();
    };

    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (!currentUser || !currentUser.email) {
            throw new Error("No user is currently signed in or user has no email.");
        }
        
        // FIX: Used firebase namespace and user methods for v8 compat.
        const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
        
        // Re-authenticate the user to ensure they are the legitimate owner of the account
        await currentUser.reauthenticateWithCredential(credential);
        
        // If re-authentication is successful, update the password
        await currentUser.updatePassword(newPassword);
    };
    
    const resetPassword = (email: string) => {
        // FIX: Used auth service method `sendPasswordResetEmail` for v8 compat.
        return auth.sendPasswordResetEmail(email);
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