import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
    
    // Fetch profile from 'profiles' table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authUser.id)
      .single();
      
    if (error) {
      console.error("Error fetching user profile:", error);
      setUser(null); // Or handle more gracefully
    } else {
      setUser({ ...authUser, ...profile });
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
