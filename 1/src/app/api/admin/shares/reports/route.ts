import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ShareReport } from "@/types/share";

export const runtime = "nodejs";

export async function GET() {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb().ref("shareReports").get();
    if (!snap.exists()) {
      return NextResponse.json({ reports: [] });
    }

    const data = snap.val() as Record<
      string,
      Record<string, Omit<ShareReport, "id">>
    >;

    const reports: ShareReport[] = [];
    for (const [postId, reporters] of Object.entries(data)) {
      for (const [reporterId, report] of Object.entries(reporters)) {
        reports.push({
          id: `${postId}_${reporterId}`,
          postId,
          reporterId,
          reporterName: report.reporterName,
          reason: report.reason,
          createdAt: report.createdAt,
          postAuthorName: report.postAuthorName,
          postPreview: report.postPreview,
        });
      }
    }

    reports.sort((a, b) => b.createdAt - a.createdAt);

    const grouped = Object.values(
      reports.reduce<
        Record<
          string,
          {
            postId: string;
            postAuthorName?: string;
            postPreview?: string;
            reportCount: number;
            latestAt: number;
            reasons: string[];
          }
        >
      >((acc, r) => {
        if (!acc[r.postId]) {
          acc[r.postId] = {
            postId: r.postId,
            postAuthorName: r.postAuthorName,
            postPreview: r.postPreview,
            reportCount: 0,
            latestAt: 0,
            reasons: [],
          };
        }
        acc[r.postId].reportCount += 1;
        acc[r.postId].latestAt = Math.max(acc[r.postId].latestAt, r.createdAt);
        acc[r.postId].reasons.push(`${r.reporterName}: ${r.reason}`);
        return acc;
      }, {})
    ).sort((a, b) => b.latestAt - a.latestAt);

    return NextResponse.json({ reports, grouped });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể tải báo cáo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
