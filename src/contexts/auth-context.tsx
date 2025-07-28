
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, createUserProfile } from '@/lib/firebase/firestore-service';
import type { AppUser, UserProfile, UserRole, UserStatus } from '@/lib/types';


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
            // Anonymous users are always 'guest' with 'active' status.
            setCurrentUser({ ...firebaseUser, role: 'guest', status: 'active' });
          } else if (firebaseUser.email === 'ainuddin@uitm.edu.my') {
            // SUPERUSER CHECK: Immediately approve this specific admin user.
            setCurrentUser({ ...firebaseUser, role: 'admin', status: 'active' });
          } else {
            // For all other authenticated users, fetch their profile from Firestore.
            const userProfile = await getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              // User has a profile in Firestore, use that for role and status.
              setCurrentUser({ ...firebaseUser, role: userProfile.role, status: userProfile.status });
            } else {
              // This can happen if profile creation failed or if the read is blocked by security rules.
              // We'll treat them as a student with a 'pending' status.
              console.warn(`No profile found for UID ${firebaseUser.uid}, or access was denied. Defaulting to 'pending' status.`);
              setCurrentUser({ ...firebaseUser, role: 'student', status: 'pending' });
            }
          }
        } catch (error) {
          console.error("Auth context error:", error);
          // If any other error occurs, treat user as pending to be safe.
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
      // onAuthStateChanged will handle the rest
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      let description = "An unexpected error occurred. Please try again.";
      // FIX: Check error.code, which is a safe string, instead of error.message
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
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
    try {
      // Step 1: Create the user in Firebase Authentication.
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // This is a critical step: Determine the role and status *before* creating the profile.
      const role: UserRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'student';
      const status: UserStatus = role === 'admin' ? 'active' : 'pending';

      // Step 2: Create the user's profile document in Firestore.
      // This ensures the /users/{uid} document exists before they ever try to log in.
      await createUserProfile(user, studentOrStaffId, role, status);

      // Step 3: Sign the user out. This is a good practice for registration flows
      // that require admin approval. It forces them to the login page.
      await signOut(auth);
      return { success: true };

    } catch (error: any) {
      console.error("Registration error:", error);
      // Let the form component handle displaying the error to the user
      // by returning the error object.
      // FIX: Return the error object itself, the form will handle the message string.
      return { success: false, error };
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
        // FIX: Use error.message but ensure it's treated as a string
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
        // FIX: Use error.message but ensure it's treated as a string
        description: String(error.message) || "Could not log out.",
      });
    } finally {
      // setCurrentUser(null) is handled by onAuthStateChanged
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
