import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { Question, QuestionStatus } from "@/types/game";

export const runtime = "nodejs";

export async function GET() {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb().ref("questions").get();
    if (!snap.exists()) {
      return NextResponse.json({ questions: [] });
    }

    const data = snap.val() as Record<
      string,
      Omit<Question, "id"> & { status?: QuestionStatus }
    >;

    const questions = Object.entries(data)
      .map(([id, q]) => ({
        id,
        clue: q.clue,
        answer: q.answer,
        contributedBy: q.contributedBy,
        createdAt: q.createdAt,
        status: q.status ?? "approved",
      }))
      .sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ questions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Không thể tải câu hỏi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
