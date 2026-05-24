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
              pixelSize={6}
              color="#F97316"
              patternScale={3}
              patternDensity={0.9}
              pixelSizeJitter={0.5}
              enableRipples
              rippleSpeed={0.4}
              rippleThickness={0.12}
              rippleIntensityScale={1.5}
              liquid
              liquidStrength={0.12}
              liquidRadius={1.2}
              liquidWobbleSpeed={5}
              speed={0.6}
              edgeFade={0.25}
              transparent
            />
          </div>
        </Suspense>
      )}
      {/* Vignette to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.00_0_0/0.85)_85%)]" />
    </div>
  );
}
