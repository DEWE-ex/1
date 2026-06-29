export interface ReportedAuthor {
  authorId: string;
  authorName?: string;
  authorPhoto?: string | null;
  totalReports: number;
  reportedPosts: number;
  latestAt: number;
  posts: Array<{
    postId: string;
    preview?: string;
    reportCount: number;
    latestAt: number;
  }>;
  banned?: boolean;
}

export interface ReportedUsersResponse {
  reported: ReportedAuthor[];
  threshold: number;
  totalBanned: number;
}