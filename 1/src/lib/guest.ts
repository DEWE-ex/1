const GUEST_KEY = "bookfinder_guest";
const GUEST_DURATION_MS = 60 * 60 * 1000;

export interface GuestSession {
  uid: string;
  displayName: string;
  expiresAt: number;
}

export function createGuestSession(): GuestSession {
  const session: GuestSession = {
    uid: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    displayName: "Khách",
    expiresAt: Date.now() + GUEST_DURATION_MS,
  };
  localStorage.setItem(GUEST_KEY, JSON.stringify(session));
  return session;
}

export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GUEST_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as GuestSession;
    if (session.expiresAt <= Date.now()) {
      localStorage.removeItem(GUEST_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(GUEST_KEY);
    return null;
  }
}

export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_KEY);
}

export function getGuestTimeLeft(): number {
  const session = getGuestSession();
  if (!session) return 0;
  return Math.max(0, session.expiresAt - Date.now());
}
