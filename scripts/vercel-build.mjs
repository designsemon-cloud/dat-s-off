/**
 * Post-build script: reshapes TanStack Start's output into Vercel Build Output API v3 format.
 *
 * TanStack Start (no Cloudflare) outputs:
 *   dist/client/  → static assets (HTML, JS, CSS)
 *   dist/server/  → Node.js server bundle (exports default.fetch)
 *
 * Vercel Build Output API v3 expects:
 *   .vercel/output/static/             → static files served from CDN
 *   .vercel/output/functions/_s.func/  → serverless function
 *   .vercel/output/config.json         → routing rules
 */

import { cpSync, mkdirSync, writeFileSync, rmSync } from "node:fs";

// Clean previous output
rmSync(".vercel/output", { recursive: true, force: true });

// Directories
mkdirSync(".vercel/output/static", { recursive: true });
mkdirSync(".vercel/output/functions/_s.func", { recursive: true });

// ── 1. Static assets ──────────────────────────────────────────────────────────
cpSync("dist/client", ".vercel/output/static", { recursive: true });

// ── 2. Server bundle ─────────────────────────────────────────────────────────
cpSync("dist/server", ".vercel/output/functions/_s.func", { recursive: true });

// Node.js wrapper: converts the Web Fetch handler to the Vercel function format
writeFileSync(
  ".vercel/output/functions/_s.func/vc-handler.mjs",
  `
import { Readable } from "node:stream";
import app from "./server.js";

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host  = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url   = new URL(req.url, \`\${proto}://\${host}\`);

  // Read body for non-GET/HEAD requests
  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    if (buf.length) body = buf;
  }

  // Build Web Fetch Request
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
    else headers.set(k, v);
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
    duplex: "half",
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  for (const [k, v] of response.headers) {
    // Skip content-encoding — Node's http module handles this automatically
    if (k.toLowerCase() !== "content-encoding") res.setHeader(k, v);
  }

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
  } else {
    res.end();
  }
}
`.trimStart(),
);

// Vercel function config
writeFileSync(
  ".vercel/output/functions/_s.func/.vc-config.json",
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "vc-handler.mjs",
      launcherType: "Nodejs",
      supportsResponseStreaming: true,
    },
    null,
    2,
  ),
);

// ── 3. Routing config ─────────────────────────────────────────────────────────
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify(
    {
      version: 3,
      routes: [
        // Serve hashed static assets with long cache (client assets use content-hash filenames)
        {
          src: "^/assets/(.+)$",
          headers: { "cache-control": "public, max-age=31536000, immutable" },
          dest: "/assets/$1",
          continue: true,
        },
        // Try static files first (images, CSS, JS bundles, etc.)
        { handle: "filesystem" },
        // Everything else → TanStack Start server (SSR + /_serverFn RPC)
        { src: "/.*", dest: "/_s" },
      ],
    },
    null,
    2,
  ),
);

console.log("✓ .vercel/output/ created");
