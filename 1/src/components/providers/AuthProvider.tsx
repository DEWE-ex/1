"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  signInWithGoogle,
  signOutUser,
  subscribeAuth,
  type User,
} from "@/lib/auth";
import {
  createGuestSession,
  getGuestSession,
  clearGuestSession,
  getGuestTimeLeft,
  type GuestSession,
} from "@/lib/guest";

export type AuthMode = "user" | "guest" | "none";

interface AuthContextValue {
  user: User | null;
  guest: GuestSession | null;
  authMode: AuthMode;
  loading: boolean;
  guestTimeLeft: number;
  signIn: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
  playerId: string | null;
  displayName: string;
  photoURL: string | null;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestTimeLeft, setGuestTimeLeft] = useState(0);

  useEffect(() => {
    const storedGuest = getGuestSession();
    if (storedGuest) setGuest(storedGuest);

    return subscribeAuth((u) => {
      setUser(u);
      if (u) {
        clearGuestSession();
        setGuest(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!guest || user) return;
    const tick = () => {
      const left = getGuestTimeLeft();
      setGuestTimeLeft(left);
      if (left <= 0) {
        clearGuestSession();
        setGuest(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [guest, user]);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signInAsGuest = useCallback(() => {
    const session = createGuestSession();
    setGuest(session);
    setGuestTimeLeft(getGuestTimeLeft());
  }, []);

  const signOut = async () => {
    clearGuestSession();
    setGuest(null);
    if (user) await signOutUser();
  };

  const authMode: AuthMode = user ? "user" : guest ? "guest" : "none";
  const isGuest = authMode === "guest";

  const displayName = user
    ? user.displayName?.split(" ")[0] ||
      user.email?.split("@")[0] ||
      "bạn"
    : guest?.displayName || "Bạn";

  const photoURL = user?.photoURL ?? null;
  const playerId = user?.uid ?? guest?.uid ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        guest,
        authMode,
        loading,
        guestTimeLeft,
        signIn,
        signInAsGuest,
        signOut,
        playerId,
        displayName,
        photoURL,
        isGuest,
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
