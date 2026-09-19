import { useEffect, useState, lazy, Suspense } from "react";

const PixelBlast = lazy(() => import("./PixelBlast.jsx"));

export function MeshBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* PixelBlast WebGL layer — client only to avoid SSR hydration mismatch */}
      {mounted && (
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            <PixelBlast
              variant="triangle"
              pixelSize={14}
              color="#F97316"
              patternScale={5}
              patternDensity={0.35}
              pixelSizeJitter={0.3}
              enableRipples={false}
              liquid={false}
              speed={0.2}
              edgeFade={0.3}
              transparent
            />
          </div>
        </Suspense>
      )}
      {/* Vignette to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.14_0.02_250/0.7)_85%)]" />
    </div>
  );
}
