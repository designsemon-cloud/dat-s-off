// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// cloudflare: false → disables @cloudflare/vite-plugin so the build targets Node.js (Vercel)
export default async (env: { command: string; mode: string }) => {
  const isBuild = env.command === "build";
  const configFactory = defineConfig({
    cloudflare: false,
    vite: {
      // noExternal: true bundles ALL node_modules into the SSR output so the
      // Vercel serverless function is self-contained (no node_modules available at runtime).
      // Only applied during `build`: in dev, Vite's SSR module runner doesn't apply the
      // CJS->ESM interop Rollup does, so bundling CJS deps like React breaks with
      // "module is not defined".
      ssr: isBuild
        ? {
            noExternal: true,
          }
        : undefined,
      build: {
        rollupOptions: {
          // Treat cloudflare:workers as an external so Rollup doesn't error on it.
          // Any remaining dynamic imports of it will throw at runtime and be caught.
          external: ["cloudflare:workers"],
        },
      },
    },
  });
  return configFactory(env);
};
