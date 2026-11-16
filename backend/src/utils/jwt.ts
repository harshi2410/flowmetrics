import crypto from "node:crypto";
import { env } from "../config/env.js";

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: string;
  name?: string;
  orgId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

function base64UrlEncode(str: string | Buffer): string {
  const buf = Buffer.isBuffer(str) ? str : Buffer.from(str);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Sign a payload into a secure HMAC-SHA256 JWT
 */
export function signJwt(
  payload: Omit<TokenPayload, "iat" | "exp">,
  expiresInSeconds: number = 86400,
  secret: string = env.JWT_SECRET
): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signatureInput);
  const signature = base64UrlEncode(hmac.digest());

  return `${signatureInput}.${signature}`;
}

/**
 * Cryptographically verify and decode an HMAC-SHA256 JWT.
 * Throws an Error if invalid or expired.
 */
export function verifyJwt(
  token: string,
  secret: string = env.JWT_SECRET
): TokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT token structure");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signatureInput);
  const expectedSignature = base64UrlEncode(hmac.digest());

  // Timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Invalid JWT token signature");
  }

  const payload: TokenPayload = JSON.parse(base64UrlDecode(encodedPayload));

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("JWT token has expired");
  }

  return payload;
}
