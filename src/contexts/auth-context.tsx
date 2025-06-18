
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, type Auth } from 'firebase/auth';
import { auth } from '@/lib/firebase/config'; // Assuming firebase config is in lib
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  // signup: (email: string, pass: string) => Promise<void>; // For future use
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // User state will be updated by onAuthStateChanged
      // Redirection can be handled by the component calling login or AuthenticatedLayout
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred.",
      });
      throw error; // Re-throw to allow form to handle its state
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // User state will be updated by onAuthStateChanged
      router.push('/'); // Redirect to login page after logout
    } catch (error: any) {
      console.error("Logout error:", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
