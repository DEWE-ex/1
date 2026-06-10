import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const questionRef = db.ref(`questions/${id}`);
    const snap = await questionRef.get();

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi" },
        { status: 404 }
      );
    }

    const status = action === "approve" ? "approved" : "rejected";
    await questionRef.update({
      status,
      reviewedAt: Date.now(),
      reviewedBy: username,
    });

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể cập nhật câu hỏi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
