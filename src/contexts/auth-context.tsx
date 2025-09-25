"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";

import {
  getUserProfile,
} from "@/lib/firebase/firestore-service";

import {
  ensureUserDocumentOnAuth,
  refreshApprovalState,
} from "@/lib/firebase/auth-service";

import type {
  AppUser,
  UserRole,
  UserStatus,
} from "@/lib/types";

// Optional: allow-list of emails that should default to admin on first sign-in.
// Your Cloud Functions also handle admin allow-listing, so this is just a helpful fallback for Firestore defaults.
const ADMIN_EMAILS = ["admin@example.com", "ainuddin@uitm.edu.my"];

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
      try {
        if (firebaseUser) {
          // Ensure /users/{uid} exists/merged and placeholders by email are cleaned up
          await ensureUserDocumentOnAuth(firebaseUser);

          // Force a fresh token so new custom claims (approved/role) are visible immediately
          const { approvedClaim, roleClaim } = await refreshApprovalState(firebaseUser);

          // Fetch the Firestore profile as the single source of truth for display info
          const profile = await getUserProfile(firebaseUser.uid);

          if (profile) {
            // Compose final AppUser (Firestore fields take precedence for role/status)
            setCurrentUser({
              ...firebaseUser,
              ...profile,
              role: (profile.role as UserRole) ?? (roleClaim as UserRole) ?? "student",
              status: (profile.status as UserStatus) ?? (approvedClaim ? "active" : "pending"),
            });
          } else if (firebaseUser.isAnonymous) {
            // Anonymous guest (no profile)
            setCurrentUser({
              ...firebaseUser,
              role: "guest",
              status: "active",
            });
          } else {
            // Fallback if profile not found (should be rare because we ensure on auth)
            const fallbackRole: UserRole = ADMIN_EMAILS.includes(firebaseUser.email || "")
              ? "admin"
              : ((roleClaim as UserRole) || "student");
            const fallbackStatus: UserStatus = fallbackRole === "admin" || approvedClaim ? "active" : "pending";

            setCurrentUser({
              ...firebaseUser,
              role: fallbackRole,
              status: fallbackStatus,
            });
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("[auth-context] onAuthStateChanged error:", err);
        // To avoid inconsistent state, sign out on unexpected errors
        try { await signOut(auth); } catch {}
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------- Actions ----------

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      // Make sure the Firestore user doc exists/merged
      await ensureUserDocumentOnAuth(cred.user);
      // Fresh token so claims are current
      await refreshApprovalState(cred.user);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    studentOrStaffId: string
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    try {
      // Create the Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      // Ensure Firestore profile is created with correct initial defaults
      // (role/status defaults are decided in ensureUserDocumentOnAuth + ADMIN_EMAILS)
      await ensureUserDocumentOnAuth(user, studentOrStaffId);

      // Force a fresh token so any default claims show quickly (not strictly required here)
      await refreshApprovalState(user);

      // Optional: sign out after registration if you want them to log in explicitly
      await signOut(auth);

      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please log in to continue.",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
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
      setCurrentUser(null);
      router.push("/");
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

  const value: AuthContextType = {
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
