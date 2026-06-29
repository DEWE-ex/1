import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ShareReport, SharePost } from "@/types/share";

export const runtime = "nodejs";

interface ReportedAuthor {
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

const REPORT_THRESHOLD = 3;

export async function GET() {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const [sharesSnap, reportsSnap, bannedSnap] = await Promise.all([
      db.ref("shares").get(),
      db.ref("shareReports").get(),
      db.ref("bannedUsers").get(),
    ]);

    const sharesData = sharesSnap.exists()
      ? (sharesSnap.val() as Record<string, Omit<SharePost, "id">>)
      : {};
    const reportsData = reportsSnap.exists()
      ? (reportsSnap.val() as Record<
          string,
          Record<string, Omit<ShareReport, "id" | "postId">>
        >)
      : {};
    const bannedData = bannedSnap.exists()
      ? (bannedSnap.val() as Record<
          string,
          { reason?: string; at?: number; by?: string; displayName?: string }
        >)
      : {};

    const postAuthorById: Record<
      string,
      { authorId: string; authorName?: string; authorPhoto?: string | null }
    > = {};
    for (const [postId, post] of Object.entries(sharesData)) {
      postAuthorById[postId] = {
        authorId: post.authorId,
        authorName: post.authorName,
        authorPhoto: post.authorPhoto ?? null,
      };
    }

    // Tổng hợp báo cáo theo từng tác giả
    const authorMap = new Map<string, ReportedAuthor>();

    for (const [postId, reporters] of Object.entries(reportsData)) {
      const meta = postAuthorById[postId];
      const authorId = meta?.authorId;
      if (!authorId) continue;

      const reportEntries = Object.values(reporters);
      const reportCount = reportEntries.length;
      if (reportCount === 0) continue;

      const latestAt = Math.max(
        ...reportEntries.map((r) => r.createdAt ?? 0)
      );

      let entry = authorMap.get(authorId);
      if (!entry) {
        entry = {
          authorId,
          authorName: meta.authorName,
          authorPhoto: meta.authorPhoto ?? null,
          totalReports: 0,
          reportedPosts: 0,
          latestAt: 0,
          posts: [],
          banned: Boolean(bannedData[authorId]),
        };
        authorMap.set(authorId, entry);
      }

      entry.totalReports += reportCount;
      entry.reportedPosts += 1;
      entry.latestAt = Math.max(entry.latestAt, latestAt);
      entry.posts.push({
        postId,
        preview: meta.authorName ? sharesData[postId]?.content?.slice(0, 120) : undefined,
        reportCount,
        latestAt,
      });

      // Cập nhật tên/avatar mới nhất
      if (meta.authorName) entry.authorName = meta.authorName;
      if (meta.authorPhoto) entry.authorPhoto = meta.authorPhoto;
    }

    // Cũng bao gồm tài khoản đã bị ban (để admin bỏ ban)
    for (const [userId, banInfo] of Object.entries(bannedData)) {
      if (!authorMap.has(userId)) {
        authorMap.set(userId, {
          authorId: userId,
          authorName: banInfo?.displayName,
          authorPhoto: null,
          totalReports: 0,
          reportedPosts: 0,
          latestAt: banInfo?.at ?? 0,
          posts: [],
          banned: true,
        });
      } else {
        const e = authorMap.get(userId)!;
        e.banned = true;
      }
    }

    const reported = Array.from(authorMap.values())
      .filter((e) => e.totalReports > REPORT_THRESHOLD || e.banned)
      .sort((a, b) => b.totalReports - a.totalReports);

    return NextResponse.json({
      reported,
      threshold: REPORT_THRESHOLD,
      totalBanned: Object.keys(bannedData).length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể tải danh sách vi phạm";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}