import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { postId } = await params;
  if (!postId) {
    return NextResponse.json({ error: "Thiếu postId" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const updates: Record<string, null> = {
      [`shares/${postId}`]: null,
      [`shareReports/${postId}`]: null,
      [`shareLikes/${postId}`]: null,
      [`shareComments/${postId}`]: null,
    };
    await db.ref().update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể xóa bài đăng";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
