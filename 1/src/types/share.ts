export type SharePostType = "book" | "achievement" | "reading";

export interface ShareComment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: number;
}

export interface SharePost {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  imageUrl?: string;
  bookTitle?: string;
  postType?: SharePostType;
  achievementId?: string;
  likeCount: number;
  commentCount: number;
  createdAt: number;
}

export interface ShareReport {
  id: string;
  postId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  createdAt: number;
  postAuthorName?: string;
  postPreview?: string;
}
