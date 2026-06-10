const ONBOARDING_KEY = "bookfinder_onboarding_done";

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingSeen(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}
