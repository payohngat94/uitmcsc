
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, createUserProfile, createProfileIfNotExist } from '@/lib/firebase/firestore-service';
import type { AppUser, UserRole, UserStatus } from '@/lib/types';


// --- List of Admin Emails ---
// To add a new admin, simply add their email to this list.
const ADMIN_EMAILS = ['admin@example.com', 'ainuddin@uitm.edu.my'];

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  register: (email: string, pass: string, studentOrStaffId: string) => Promise<{ success: boolean; error?: any }>;
  signInAsGuestAnonymously: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          if (firebaseUser.isAnonymous) {
            setCurrentUser({ ...firebaseUser, role: 'guest', status: 'active' });
          } else if (firebaseUser.email === 'ainuddin@uitm.edu.my') {
            setCurrentUser({ ...firebaseUser, role: 'admin', status: 'active' });
          } else {
            const userProfile = await getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              setCurrentUser({ ...firebaseUser, ...userProfile });
            } else {
              console.warn(`No profile found for UID ${firebaseUser.uid}, or access was denied. Defaulting to 'pending' status.`);
              setCurrentUser({ ...firebaseUser, role: 'student', status: 'pending' });
            }
          }
        } catch (error) {
          console.error("Auth context error:", error);
          if (firebaseUser) {
            setCurrentUser({ ...firebaseUser, role: 'student', status: 'pending' });
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "The email or password you entered is incorrect.";
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: description,
      });
      return { success: false, error };
    } finally {
        setLoading(false);
    }
  };

  const register = async (email: string, pass: string, studentOrStaffId: string): Promise<{ success: boolean; error?: any }> => {
    const role: UserRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'student';
    const status: UserStatus = role === 'admin' ? 'active' : 'pending';

    await createProfileIfNotExist(email, studentOrStaffId, role, status);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      await createUserProfile(user, studentOrStaffId, role, status);

      await signOut(auth);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created and is now pending approval. Please log in to continue.",
      });

      return { success: true };

    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error };
    }
  };


  const signInAsGuestAnonymously = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
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
        description: String(error.message) || "Could not sign in as guest.",
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
        description: String(error.message) || "Could not log out.",
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
