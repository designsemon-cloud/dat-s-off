// Checks every resource in the learning catalog (src/lib/learn.ts).
//   npm run check:links
//
// - Articles and tools: GET must end in 200 (after redirects), and the page
//   <title> must contain the resource's `expect` words.
// - YouTube: the oEmbed endpoint answers 200 with the real title only for a
//   live, embeddable video; that title must contain `expect`.
// - Preview images (YouTube frames, articles' og:image): 200 and image/*.
// Exits non-zero on any failure. A resource that fails is removed from the
// catalog, never shipped. See design-system/patterns/learning.md.

import { PRINCIPLES, previewImage } from "../src/lib/learn.ts";

const UA = { "user-agent": "Mozilla/5.0 (link check)", "accept-language": "en" };
const norm = (s) =>
  s
    .replace(/&#x27;|&#39;|&rsquo;|’/g, "'")
    .replace(/&amp;/g, "&")
    .toLowerCase();

async function checkImage(r) {
  const img = previewImage(r);
  if (!img) return null;
  const res = await fetch(img, { headers: UA });
  const type = res.headers.get("content-type") ?? "";
  return res.ok && type.startsWith("image/") ? null : `preview ${res.status} ${type}`;
}

async function check(r) {
  return (await checkPage(r)) ?? (await checkImage(r));
}

async function checkPage(r) {
  const yt = r.url.match(/youtube\.com\/watch\?v=([\w-]{11})/);
  if (yt) {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(r.url)}&format=json`,
    );
    if (!res.ok) return `oEmbed ${res.status}`;
    const { title } = await res.json();
    return norm(title).includes(norm(r.expect)) ? null : `title is "${title}"`;
  }
  const res = await fetch(r.url, { headers: UA, redirect: "follow" });
  if (res.status !== 200) return `HTTP ${res.status}`;
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() ?? "";
  return norm(title).includes(norm(r.expect)) ? null : `title is "${title}"`;
}

// The same URL can serve several principles; check it once.
const unique = new Map();
for (const p of PRINCIPLES) for (const r of p.resources) unique.set(r.url, r);

const results = await Promise.all(
  [...unique.values()].map(async (r) => {
    try {
      return { r, error: await check(r) };
    } catch (e) {
      return { r, error: String(e?.message ?? e) };
    }
  }),
);

let failed = 0;
for (const { r, error } of results) {
  if (error) failed++;
  console.log(
    `${error ? "FAIL" : " ok "}  ${r.kind.padEnd(7)} ${r.url}${error ? `  ← ${error}` : ""}`,
  );
}
console.log(
  `\n${results.length - failed}/${results.length} links ok across ${PRINCIPLES.length} principles.`,
);
process.exit(failed ? 1 : 0);
