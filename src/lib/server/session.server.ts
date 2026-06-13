// Server-only JWT session helpers (httpOnly cookie).
import { SignJWT, jwtVerify } from "jose";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "pintos_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string; // airtable record id
  email: string;
  role: "user" | "seller";
  name: string;
};

export async function issueSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey());
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof (payload as any).email !== "string") return null;
    return {
      sub: payload.sub,
      email: (payload as any).email,
      role: (payload as any).role,
      name: (payload as any).name,
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  deleteCookie(COOKIE_NAME, { path: "/" });
}
