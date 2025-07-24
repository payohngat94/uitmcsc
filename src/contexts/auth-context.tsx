
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInAnonymously, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, createUserProfile } from '@/lib/firebase/firestore-service';
import type { UserRole, UserStatus } from '@/lib/types';

// AppUser type now includes the user's approval status
export type AppUser = FirebaseUser & { role: UserRole; status: UserStatus; };

// --- List of Admin Emails ---
// To add a new admin, simply add their email to this list.
const ADMIN_EMAILS = ['admin@example.com'];

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, pass: string, studentOrStaffId: string) => Promise<void>;
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
          } else {
            // For authenticated users, fetch their profile from Firestore.
            const userProfile = await getUserProfile(firebaseUser.uid);
            
            if (userProfile) {
              // User has a profile in Firestore, use that for role and status.
              setCurrentUser({ ...firebaseUser, role: userProfile.role, status: userProfile.status });
            } else {
              // This case handles a logged-in user who does NOT have a firestore document.
              // This can happen if profile creation fails or if the read is blocked by security rules.
              // We'll treat them as a student with a 'pending' status.
              // This prevents an app crash and ensures they land on the pending page.
              console.warn(`No profile found for UID ${firebaseUser.uid}, or access was denied. Defaulting to 'pending' status.`);
              setCurrentUser({ ...firebaseUser, role: 'student', status: 'pending' });
            }
          }
        } catch (error) {
          console.error("Auth context error:", error);
          // If any other error occurs, treat user as pending to be safe.
           setCurrentUser({ ...firebaseUser, role: 'student', status: 'pending' });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const userProfile = await getUserProfile(userCredential.user.uid);

      if (userProfile?.status === 'active') {
         toast({
          title: "Login Successful",
          description: "Welcome back to UiTM CSC!",
        });
      }
      // onAuthStateChanged will handle setting state and redirection logic will be handled by layouts
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
      throw error; 
    } finally {
        setLoading(false);
    }
  };

  const register = async (email: string, pass: string, studentOrStaffId: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await createUserProfile(userCredential.user, studentOrStaffId);

      // After registration, log the user out so they can't access the app
      // until an admin approves their account. This prevents the "pending"
      // user from being in a logged-in state, which avoids the permission error
      // when the app tries to read their yet-unapproved profile.
      await signOut(auth);

      toast({
        title: "Registration Successful",
        description: "Your account is pending approval. You will be able to log in once an administrator has verified your account.",
      });
      router.push("/"); 

    } catch (error: any) {
      console.error("Registration error:", error);
      // Let the form component handle displaying the error to the user
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
