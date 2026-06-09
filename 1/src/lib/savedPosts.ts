import { get, onValue, ref, remove, set } from "firebase/database";
import { getDb } from "./firebase";

const LOCAL_KEY = "bookfinder_saved_posts";

function readLocalSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSaved(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

export async function hasSavedPost(
  postId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();
  const snap = await get(ref(db, `shareSaved/${userId}/${postId}`));
  if (snap.exists()) return true;
  return readLocalSaved().includes(postId);
}

export async function toggleSavePost(
  postId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();
  const saveRef = ref(db, `shareSaved/${userId}/${postId}`);
  const snap = await get(saveRef);
  const saved = snap.exists();

  if (saved) {
    await remove(saveRef);
    const local = readLocalSaved().filter((id) => id !== postId);
    writeLocalSaved(local);
    return false;
  }

  await set(saveRef, true);
  const local = readLocalSaved();
  if (!local.includes(postId)) {
    writeLocalSaved([postId, ...local]);
  }
  return true;
}

export function subscribeSavedPostIds(
  userId: string,
  callback: (ids: string[]) => void
): () => void {
  const db = getDb();
  const savedRef = ref(db, `shareSaved/${userId}`);

  return onValue(savedRef, (snap) => {
    const remoteIds = snap.exists()
      ? Object.keys(snap.val() as Record<string, true>)
      : [];
    const localIds = readLocalSaved();
    const merged = [...new Set([...remoteIds, ...localIds])];
    callback(merged);
  });
}
