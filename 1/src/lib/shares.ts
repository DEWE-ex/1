import {
  ref,
  push,
  set,
  get,
  update,
  onValue,
  runTransaction,
  remove,
} from "firebase/database";
import { getDb } from "./firebase";
import type { ShareComment, SharePost, SharePostType } from "@/types/share";

function normalizePost(id: string, data: Omit<SharePost, "id">): SharePost {
  return { id, ...data };
}

export async function createSharePost(
  authorId: string,
  authorName: string,
  authorPhoto: string | undefined,
  content: string,
  imageUrl?: string,
  bookTitle?: string,
  postType: SharePostType = "book",
  achievementId?: string
): Promise<string> {
  const db = getDb();
  const newRef = push(ref(db, "shares"));
  await set(newRef, {
    authorId,
    authorName,
    authorPhoto: authorPhoto || null,
    content: content.trim(),
    imageUrl: imageUrl || null,
    bookTitle: bookTitle || null,
    postType,
    achievementId: achievementId || null,
    likeCount: 0,
    commentCount: 0,
    createdAt: Date.now(),
  });
  return newRef.key!;
}

export function subscribeShares(
  callback: (posts: SharePost[]) => void
): () => void {
  const db = getDb();
  const sharesRef = ref(db, "shares");
  return onValue(sharesRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.val() as Record<string, Omit<SharePost, "id">>;
    const posts = Object.entries(data)
      .map(([id, p]) => normalizePost(id, p))
      .sort((a, b) => {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        return b.createdAt - a.createdAt;
      });
    callback(posts);
  });
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();
  const likeRef = ref(db, `shareLikes/${postId}/${userId}`);
  const postRef = ref(db, `shares/${postId}`);

  const likeSnap = await get(likeRef);
  const liked = likeSnap.exists();

  if (liked) {
    await remove(likeRef);
    await runTransaction(postRef, (post) => {
      if (!post) return post;
      return { ...post, likeCount: Math.max(0, (post.likeCount || 0) - 1) };
    });
    return false;
  }

  await set(likeRef, true);
  await runTransaction(postRef, (post) => {
    if (!post) return post;
    return { ...post, likeCount: (post.likeCount || 0) + 1 };
  });
  return true;
}

export async function hasLiked(
  postId: string,
  userId: string
): Promise<boolean> {
  const db = getDb();
  const snap = await get(ref(db, `shareLikes/${postId}/${userId}`));
  return snap.exists();
}

export function subscribeComments(
  postId: string,
  callback: (comments: ShareComment[]) => void
): () => void {
  const db = getDb();
  const commentsRef = ref(db, `shareComments/${postId}`);
  return onValue(commentsRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const data = snap.val() as Record<string, ShareComment>;
    const comments = Object.values(data).sort(
      (a, b) => a.createdAt - b.createdAt
    );
    callback(comments);
  });
}

export async function addComment(
  postId: string,
  authorId: string,
  authorName: string,
  authorPhoto: string | undefined,
  content: string
): Promise<void> {
  const db = getDb();
  const newRef = push(ref(db, `shareComments/${postId}`));
  await set(newRef, {
    id: newRef.key,
    authorId,
    authorName,
    authorPhoto: authorPhoto || null,
    content: content.trim(),
    createdAt: Date.now(),
  });
  await runTransaction(ref(db, `shares/${postId}`), (post) => {
    if (!post) return post;
    return { ...post, commentCount: (post.commentCount || 0) + 1 };
  });
}
