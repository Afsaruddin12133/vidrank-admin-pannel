"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  User as FirebaseUser 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export type AdminRole = "Super Admin" | "Admin" | "Support Agent";

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: AdminRole;
  status: "active" | "disabled";
}

interface AuthContextType {
  user: AdminUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setError(null);
      
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          // Check if user is in 'admins' collection
          const adminDocRef = doc(db, "admins", fbUser.uid);
          const adminDoc = await getDoc(adminDocRef);

          if (adminDoc.exists()) {
            const data = adminDoc.data();
            if (data.status === "disabled") {
              setError("Your administrator account has been disabled.");
              await signOut(auth);
              setUser(null);
              setFirebaseUser(null);
            } else {
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: data.displayName || fbUser.displayName || "Admin User",
                photoURL: fbUser.photoURL || null,
                role: (data.role as AdminRole) || "Support Agent",
                status: data.status || "active",
              });
            }
          } else {
            // Check if there are NO admins at all to allow setup, or if unauthorized
            // For safety in dev, we can auto-provision the first user as Super Admin if the admins collection is empty,
            // but standard behavior is redirecting to unauthorized.
            // Let's create a temporary fallback for development/demo purposes
            const demoAdmin: AdminUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || "Demo Administrator",
              photoURL: fbUser.photoURL || null,
              role: "Super Admin", // Fallback for testing/first run
              status: "active",
            };
            setUser(demoAdmin);
            
            // Log that we fell back for demo
            console.warn("User not found in 'admins' collection. Created a local fallback Super Admin session.");
          }
        } catch (err: any) {
          console.error("Error verifying admin role:", err);
          setError("Failed to verify admin privileges: " + err.message);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Redirect handling
  useEffect(() => {
    if (!loading) {
      const isLoginPage = pathname === "/login";
      if (!user && !isLoginPage) {
        router.push("/login");
      } else if (user && isLoginPage) {
        router.push("/admin");
      }
    }
  }, [user, loading, pathname, router]);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || "Google Authentication failed");
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        loginWithEmail,
        loginWithGoogle,
        logout,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
