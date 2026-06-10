import { NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  createSessionToken,
  adminCookieName,
  sessionMaxAge,
} from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tài khoản và mật khẩu" },
        { status: 400 }
      );
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: "Sai tài khoản hoặc mật khẩu" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const response = NextResponse.json({ ok: true, username });
    response.cookies.set(adminCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionMaxAge,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Lỗi đăng nhập" }, { status: 500 });
  }
}
