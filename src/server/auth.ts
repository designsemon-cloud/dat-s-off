import { createServerFn } from "@tanstack/react-start";
import { Redis } from "@upstash/redis";
import type { AuthUser } from "@/lib/auth-types";

const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds
const MIN_PASSWORD = 8;
const FREE_CREDITS = 5;

type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  picture?: string;
  credits: number;
  createdAt: string;
};

type StoredSession = {
  userId: string;
  expiresAt: string;
};

// ─── KV abstraction ───────────────────────────────────────────────────────────

interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

class MemKV implements KVStore {
  private data = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.data.set(key, {
      value,
      expiresAt: options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
}

const MEM_KV_KEY = Symbol.for("uxcc.kv");
function getMemKV(): MemKV {
  const g = globalThis as Record<symbol, unknown>;
  if (!g[MEM_KV_KEY]) g[MEM_KV_KEY] = new MemKV();
  return g[MEM_KV_KEY] as MemKV;
}

// Thin adapter so Upstash Redis matches our KVStore interface
class UpstashKV implements KVStore {
  constructor(private redis: Redis) {}

  async get(key: string): Promise<string | null> {
    const val = await this.redis.get<string>(key);
    return val ?? null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    if (options?.expirationTtl) {
      await this.redis.set(key, value, { ex: options.expirationTtl });
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

/** The app's key-value store: Upstash Redis when configured, else memory. */
export async function store(): Promise<KVStore> {
  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (url && token) {
    return new UpstashKV(new Redis({ url, token }));
  }
  return getMemKV();
}

// ─── Password utilities ───────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${toHex(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const derived = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return derived === hashHex;
}

async function createSession(kv: KVStore, user: StoredUser): Promise<string> {
  const token = crypto.randomUUID();
  const session: StoredSession = {
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL * 1000).toISOString(),
  };
  await kv.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL });
  return token;
}

// ─── Public server functions ──────────────────────────────────────────────────

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { email: string; password: string; name: string })
  .handler(async ({ data }): Promise<{ sessionToken: string; user: AuthUser }> => {
    const kv = await store();

    if (data.password.length < MIN_PASSWORD)
      throw new Error(`Password must be at least ${MIN_PASSWORD} characters.`);

    const normalEmail = data.email.toLowerCase().trim();
    if (await kv.get(`email:${normalEmail}`))
      throw new Error("An account with this email already exists.");

    const id = crypto.randomUUID();
    const user: StoredUser = {
      id,
      email: normalEmail,
      name: data.name.trim(),
      passwordHash: await hashPassword(data.password),
      credits: FREE_CREDITS,
      createdAt: new Date().toISOString(),
    };

    await kv.put(`user:${id}`, JSON.stringify(user));
    await kv.put(`email:${normalEmail}`, id);

    const sessionToken = await createSession(kv, user);
    return {
      sessionToken,
      user: { id, email: user.email, name: user.name, credits: user.credits },
    };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { email: string; password: string })
  .handler(async ({ data }): Promise<{ sessionToken: string; user: AuthUser }> => {
    const kv = await store();
    const normalEmail = data.email.toLowerCase().trim();

    const userId = await kv.get(`email:${normalEmail}`);
    if (!userId) throw new Error("Invalid email or password.");

    const raw = await kv.get(`user:${userId}`);
    if (!raw) throw new Error("Invalid email or password.");

    const user = JSON.parse(raw) as StoredUser;
    if (!user.passwordHash)
      throw new Error("This account uses Google sign-in. Please sign in with Google.");

    if (!(await verifyPassword(data.password, user.passwordHash)))
      throw new Error("Invalid email or password.");

    const sessionToken = await createSession(kv, user);
    return {
      sessionToken,
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
    };
  });

// ─── Google sign-in ───────────────────────────────────────────────────────────
//
// Authorization-code flow in a popup (Google Identity Services
// `initCodeClient`, ux_mode "popup"). The browser only ever holds a one-time
// code; this server swaps it for tokens with the client secret, straight from
// Google over TLS, then checks the ID token's claims before trusting it.
// Setup: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (see .env.local), and the
// site's origin under "Authorized JavaScript origins" on the OAuth client.

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

function googleCredentials() {
  const clientId = process.env["GOOGLE_CLIENT_ID"] || process.env["VITE_GOOGLE_CLIENT_ID"] || "";
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"] || "";
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

type GoogleClaims = {
  iss: string;
  aud: string;
  exp: number;
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
};

function decodeJwtPayload(jwt: string): GoogleClaims {
  const part = jwt.split(".")[1];
  if (!part) throw new Error("Google sign-in failed. Please try again.");
  const b64 = part
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(part.length / 4) * 4, "=");
  const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
  return JSON.parse(json) as GoogleClaims;
}

/** Public: whether Google sign-in is set up, and the (public) client ID. */
export const getGoogleAuthConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ clientId: string | null }> => ({
    clientId: googleCredentials()?.clientId ?? null,
  }),
);

export const signInWithGoogle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { code: string })
  .handler(async ({ data }): Promise<{ sessionToken: string; user: AuthUser }> => {
    const creds = googleCredentials();
    if (!creds) throw new Error("Google sign-in isn't set up yet.");
    if (typeof data.code !== "string" || !data.code)
      throw new Error("Google sign-in failed. Please try again.");

    // 1. Exchange the one-time code. "postmessage" is the redirect URI GIS
    //    uses for the popup flow.
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await res.json().catch(() => ({}))) as { id_token?: string };
    if (!res.ok || !tokens.id_token) throw new Error("Google sign-in failed. Please try again.");

    // 2. The ID token came from Google directly over TLS, so its claims can be
    //    trusted once they're checked (OpenID Connect Core §3.1.3.7).
    const claims = decodeJwtPayload(tokens.id_token);
    const verified = claims.email_verified === true || claims.email_verified === "true";
    if (
      !GOOGLE_ISSUERS.has(claims.iss) ||
      claims.aud !== creds.clientId ||
      claims.exp * 1000 < Date.now() ||
      !claims.sub ||
      !claims.email
    )
      throw new Error("Google sign-in failed. Please try again.");
    // Only a verified address may join an existing account with that email.
    if (!verified) throw new Error("Please verify your Google account's email first.");

    const kv = await store();
    const normalEmail = claims.email.toLowerCase();
    let user: StoredUser | null = null;

    const byGoogle = await kv.get(`google:${claims.sub}`);
    const linkedId = byGoogle ?? (await kv.get(`email:${normalEmail}`));
    if (linkedId) {
      const raw = await kv.get(`user:${linkedId}`);
      if (raw) user = JSON.parse(raw) as StoredUser;
    }

    if (user) {
      // Returning user, or an email/password account signing in with Google
      // for the first time: link it and refresh the picture.
      const changed =
        user.googleId !== claims.sub || (claims.picture && user.picture !== claims.picture);
      user.googleId = claims.sub;
      if (claims.picture) user.picture = claims.picture;
      if (changed) await kv.put(`user:${user.id}`, JSON.stringify(user));
      if (!byGoogle) await kv.put(`google:${claims.sub}`, user.id);
    } else {
      user = {
        id: crypto.randomUUID(),
        email: normalEmail,
        name: claims.name ?? normalEmail.split("@")[0],
        googleId: claims.sub,
        picture: claims.picture,
        credits: FREE_CREDITS,
        createdAt: new Date().toISOString(),
      };
      await kv.put(`user:${user.id}`, JSON.stringify(user));
      await kv.put(`email:${normalEmail}`, user.id);
      await kv.put(`google:${claims.sub}`, user.id);
    }

    const sessionToken = await createSession(kv, user);
    return {
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        picture: user.picture,
      },
    };
  });

export const getSession = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => d as { sessionToken: string })
  .handler(async ({ data }): Promise<AuthUser | null> => {
    if (!data.sessionToken) return null;
    try {
      const kv = await store();
      const raw = await kv.get(`session:${data.sessionToken}`);
      if (!raw) return null;
      const session = JSON.parse(raw) as StoredSession;
      if (new Date(session.expiresAt) < new Date()) {
        await kv.delete(`session:${data.sessionToken}`);
        return null;
      }
      const userRaw = await kv.get(`user:${session.userId}`);
      if (!userRaw) return null;
      const user = JSON.parse(userRaw) as StoredUser;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        picture: user.picture,
      };
    } catch {
      return null;
    }
  });

export const signOut = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { sessionToken: string })
  .handler(async ({ data }): Promise<void> => {
    if (!data.sessionToken) return;
    try {
      await (await store()).delete(`session:${data.sessionToken}`);
    } catch {
      /* silently ignore */
    }
  });

export const useCredit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { sessionToken: string; cost?: number })
  .handler(async ({ data }): Promise<{ remainingCredits: number }> => {
    const cost = data.cost ?? 1;
    const kv = await store();
    const sessionRaw = await kv.get(`session:${data.sessionToken}`);
    if (!sessionRaw) throw new Error("Session not found. Please sign in again.");

    const session = JSON.parse(sessionRaw) as StoredSession;
    const userRaw = await kv.get(`user:${session.userId}`);
    if (!userRaw) throw new Error("User not found.");

    const user = JSON.parse(userRaw) as StoredUser;
    if (user.credits < cost)
      throw new Error(`Not enough credits. This analysis costs ${cost} credits.`);

    user.credits -= cost;
    await kv.put(`user:${session.userId}`, JSON.stringify(user));
    return { remainingCredits: user.credits };
  });
