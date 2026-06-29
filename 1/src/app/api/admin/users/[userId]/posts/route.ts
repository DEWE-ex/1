import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { SharePost } from "@/types/share";

export const runtime = "nodejs";

// Xoá toàn bộ bài viết của một tác giả + likes/comments/reports liên quan.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const sharesSnap = await db.ref("shares").get();
    if (!sharesSnap.exists()) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }

    const data = sharesSnap.val() as Record<
      string,
      Omit<SharePost, "id">
    >;

    const updates: Record<string, null> = {};
    let deleted = 0;
    for (const [postId, post] of Object.entries(data)) {
      if (post.authorId !== userId) continue;
      updates[`shares/${postId}`] = null;
      updates[`shareReports/${postId}`] = null;
      updates[`shareLikes/${postId}`] = null;
      updates[`shareComments/${postId}`] = null;
      deleted += 1;
    }

    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể xoá bài viết";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}