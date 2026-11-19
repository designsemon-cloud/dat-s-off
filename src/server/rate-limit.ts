import { Redis } from "@upstash/redis";

const WINDOW_S = 24 * 60 * 60;
const DEFAULT_LIMIT = 5;

interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
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
}

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
}

const MEM_KV_KEY = Symbol.for("uxcc.rate-limit.kv");
function getMemKV(): MemKV {
  const g = globalThis as Record<symbol, unknown>;
  if (!g[MEM_KV_KEY]) g[MEM_KV_KEY] = new MemKV();
  return g[MEM_KV_KEY] as MemKV;
}

function store(): KVStore {
  // Upstash from the Vercel Marketplace names these KV_REST_API_*.
  const url = process.env["UPSTASH_REDIS_REST_URL"] || process.env["KV_REST_API_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"] || process.env["KV_REST_API_TOKEN"];
  if (url && token) return new UpstashKV(new Redis({ url, token }));
  return getMemKV();
}

// Real (KV-backed, multi-instance-safe when Upstash is configured) rate limit,
// keyed by an arbitrary bucket string (e.g. "flow:<sessionKey>").
export async function checkRateLimit(key: string, limit = DEFAULT_LIMIT): Promise<boolean> {
  const kv = store();
  const raw = await kv.get(`ratelimit:${key}`);
  const entry = raw ? (JSON.parse(raw) as { count: number }) : { count: 0 };
  if (entry.count >= limit) return false;
  entry.count += 1;
  await kv.put(`ratelimit:${key}`, JSON.stringify(entry), { expirationTtl: WINDOW_S });
  return true;
}
