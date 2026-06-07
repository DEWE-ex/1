const PLAYER_ID_KEY = "karuta_player_id";
const PLAYER_NAME_KEY = "karuta_player_name";

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

export function setStoredPlayerId(id: string): void {
  localStorage.setItem(PLAYER_ID_KEY, id);
}

export function getStoredPlayerName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(PLAYER_NAME_KEY) || "";
}

export function setStoredPlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}
