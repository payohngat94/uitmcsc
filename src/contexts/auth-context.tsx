
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from '@/lib/types';

// AppUser type remains the same, role is part of it
export type AppUser = FirebaseUser & { role: UserRole };

// --- List of Admin Emails ---
// To add a new admin, simply add their email to this list.
const ADMIN_EMAILS = ['admin@example.com'];

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, pass: string, displayName: string) => Promise<void>;
  signInAsGuestAnonymously: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        let role: UserRole;
        if (firebaseUser.isAnonymous) {
          role = 'guest';
        } else if (firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email)) {
          role = 'admin';
        } else {
          role = 'student'; // Default to student for other authenticated users
        }
        setCurrentUser({ ...firebaseUser, role });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting currentUser with role
    } catch (error: any) {
      console.error("Login error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "The email or password you entered is incorrect. Please check your details and try again.";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
      setLoading(false); 
      throw error; 
    }
  };

  const register = async (email: string, pass: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      // After creating the user, update their profile with the display name (Student/Staff ID)
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      // onAuthStateChanged will automatically pick up the new user and their updated profile,
      // and then set the correct role and update the currentUser state.
    } catch (error: any) {
      console.error("Registration error:", error);
      let description = "An unexpected error occurred during registration.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please try logging in.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password.";
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: description,
      });
      setLoading(false);
      throw error;
    }
  };

  const signInAsGuestAnonymously = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      // onAuthStateChanged will handle setting currentUser with 'guest' role
      toast({
        title: "Signed in as Guest",
        description: "You are now browsing with guest privileges.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Anonymous login error:", error);
      toast({
        variant: "destructive",
        title: "Guest Login Failed",
        description: error.message || "Could not sign in as guest.",
      });
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push('/'); 
    } catch (error: any) {
      console.error("Logout error:", error);
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
    } finally {
      setLoading(false); 
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    signInAsGuestAnonymously,
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
