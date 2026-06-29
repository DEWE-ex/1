import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "karuta_admin_session";
const SESSION_HOURS = 24;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET chưa được cấu hình");
  return secret;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return false;

  return safeCompare(username, adminUser) && safeCompare(password, adminPass);
}

export function createSessionToken(username: string): string {
  const expiry = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = `${username}:${expiry}`;
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const colonIdx = payload.indexOf(":");
    const username = payload.slice(0, colonIdx);
    const expiry = Number(payload.slice(colonIdx + 1));
    if (!username || Number.isNaN(expiry) || Date.now() > expiry) return null;

    return username;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const adminCookieName = COOKIE_NAME;
export const sessionMaxAge = SESSION_HOURS * 60 * 60;
