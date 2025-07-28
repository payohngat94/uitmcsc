
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, createUserProfile, createProfileIfNotExist } from '@/lib/firebase/firestore-service';
import type { AppUser, UserRole, UserStatus, UserProfile } from '@/lib/types';


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
          // Note: The role is now primarily controlled by the Firestore document.
          // This ensures consistency. The local `isAdmin` check is a fallback.
          const userProfile = await getUserProfile(firebaseUser.uid);

          if (userProfile) {
            // Combine Firebase user data with Firestore profile data
            setCurrentUser({ ...firebaseUser, ...userProfile });
          } else if (firebaseUser.isAnonymous) {
            // Handle anonymous guest users who won't have a Firestore profile
             setCurrentUser({
              ...firebaseUser,
              role: 'guest',
              status: 'active'
            });
          } else {
            // This case might happen if Firestore profile creation is delayed
            // or for the superuser who might not have a doc initially.
            console.warn(`No profile found for UID ${firebaseUser.uid}. Defaulting to temporary role.`);
            const role = ADMIN_EMAILS.includes(firebaseUser.email || "") ? 'admin' : 'student';
            setCurrentUser({
              ...firebaseUser,
              role: role,
              status: role === 'admin' ? 'active' : 'pending'
            });
          }
        } catch (error) {
          console.error("Auth context error:", error);
          // If there's an error fetching the profile, log out the user to prevent inconsistent state
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
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
      // Handle specific Firebase auth errors
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
    // For admins, status is active. For students, it's pending admin approval.
    const status: UserStatus = role === 'admin' ? 'active' : 'pending';

    try {
      // Step 1: Create a placeholder profile or get the existing one's ID.
      const docId = await createProfileIfNotExist(email, studentOrStaffId, role, status);

      // Step 2: Attempt to create the user in Firebase Auth.
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Step 3: Update the profile with the official UID.
      await createUserProfile(docId, user, studentOrStaffId, role, status);

      // Step 4: Sign the user out. They need to log in after their account is approved.
      await signOut(auth);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created and is now pending approval. Please log in to continue.",
      });

      return { success: true };

    } catch (error: any) {
      console.error("Registration error:", error);
      // Provide specific feedback for common errors
      if (error.code === 'auth/email-already-in-use') {
        // The toast is now handled in the form's onSubmit
      } else if (error.code === 'auth/weak-password') {
        // The toast is handled in the form's onSubmit
      }
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
      setCurrentUser(null); // Explicitly clear user state
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
