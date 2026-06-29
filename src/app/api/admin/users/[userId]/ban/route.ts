import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

interface BanBody {
  reason?: string;
  displayName?: string;
}

// Ban tài khoản (lưu vào node bannedUsers).
export async function POST(
  req: Request,
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

  let body: BanBody = {};
  try {
    body = (await req.json()) as BanBody;
  } catch {
    body = {};
  }

  try {
    const db = getAdminDb();
    await db.ref(`bannedUsers/${userId}`).set({
      reason: body.reason?.trim() || "Vi phạm nhiều lần",
      displayName: body.displayName?.trim() || null,
      at: Date.now(),
      by: username,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể ban tài khoản";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Bỏ ban.
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
    await db.ref(`bannedUsers/${userId}`).remove();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể bỏ ban";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}