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

async function store(): Promise<KVStore> {
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

export const signInWithGoogle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { credential: string })
  .handler(async ({ data }): Promise<{ sessionToken: string; user: AuthUser }> => {
    const kv = await store();

    // Decode Google JWT payload (add RS256 signature verification for production)
    const parts = data.credential.split(".");
    if (parts.length !== 3) throw new Error("Invalid Google credential.");
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
    };
    if (!payload.sub || !payload.email) throw new Error("Invalid Google credential payload.");

    const normalEmail = payload.email.toLowerCase();
    let userId: string;

    const existingByGoogle = await kv.get(`google:${payload.sub}`);
    if (existingByGoogle) {
      userId = existingByGoogle;
      if (payload.picture) {
        const raw = await kv.get(`user:${userId}`);
        if (raw) {
          const u = JSON.parse(raw) as StoredUser;
          if (u.picture !== payload.picture) {
            u.picture = payload.picture;
            await kv.put(`user:${userId}`, JSON.stringify(u));
          }
        }
      }
    } else {
      const existingByEmail = await kv.get(`email:${normalEmail}`);
      if (existingByEmail) {
        userId = existingByEmail;
        const raw = await kv.get(`user:${userId}`);
        if (raw) {
          const u = JSON.parse(raw) as StoredUser;
          u.googleId = payload.sub;
          if (payload.picture) u.picture = payload.picture;
          await kv.put(`user:${userId}`, JSON.stringify(u));
        }
        await kv.put(`google:${payload.sub}`, userId);
      } else {
        userId = crypto.randomUUID();
        const user: StoredUser = {
          id: userId,
          email: normalEmail,
          name: payload.name ?? normalEmail.split("@")[0],
          googleId: payload.sub,
          picture: payload.picture,
          credits: FREE_CREDITS,
          createdAt: new Date().toISOString(),
        };
        await kv.put(`user:${userId}`, JSON.stringify(user));
        await kv.put(`email:${normalEmail}`, userId);
        await kv.put(`google:${payload.sub}`, userId);
      }
    }

    const raw = await kv.get(`user:${userId}`);
    if (!raw) throw new Error("Failed to load user.");
    const user = JSON.parse(raw) as StoredUser;

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
  .inputValidator((d: unknown) => d as { sessionToken: string })
  .handler(async ({ data }): Promise<{ remainingCredits: number }> => {
    const kv = await store();
    const sessionRaw = await kv.get(`session:${data.sessionToken}`);
    if (!sessionRaw) throw new Error("Session not found. Please sign in again.");

    const session = JSON.parse(sessionRaw) as StoredSession;
    const userRaw = await kv.get(`user:${session.userId}`);
    if (!userRaw) throw new Error("User not found.");

    const user = JSON.parse(userRaw) as StoredUser;
    if (user.credits <= 0) throw new Error("No credits remaining. Please add more credits.");

    user.credits -= 1;
    await kv.put(`user:${session.userId}`, JSON.stringify(user));
    return { remainingCredits: user.credits };
  });
