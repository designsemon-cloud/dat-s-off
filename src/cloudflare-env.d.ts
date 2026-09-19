interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface CloudflareEnv {
  AUTH_STORE: KVNamespace;
  OPENAI_API_KEY: string;
  GOOGLE_CLIENT_SECRET: string;
}

declare module "cloudflare:workers" {
  export const env: CloudflareEnv;
}
