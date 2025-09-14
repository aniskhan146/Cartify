import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    // Fetch only the role from 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();
      
    if (error) {
      console.error("Error fetching user profile:", error);
      // Fallback: still set user from auth session but without a role
      setUser({
        ...authUser,
        full_name: authUser.user_metadata?.full_name,
      });
    } else {
      // Combine auth user data with the role from profiles
      const fullUser = {
        ...authUser,
        full_name: authUser.user_metadata?.full_name,
        role: profile?.role,
      };
      setUser(fullUser);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const authUser = session?.user || null;
        fetchUserProfile(authUser);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });
    if (error) throw error;
    // Note: A 'profiles' entry is created by a trigger in Supabase
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signUp,
      logout,
      isAdmin,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};