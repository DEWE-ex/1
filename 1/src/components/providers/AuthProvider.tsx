"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  type User,
} from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  playerId: string | null;
  displayName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeAuth((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
  };

  const displayName =
    user?.displayName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "bạn";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        playerId: user?.uid ?? null,
        displayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
