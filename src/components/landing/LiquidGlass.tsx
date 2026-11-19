import { Fragment, useEffect } from "react";

// iOS-style liquid glass for the landing nav (.liquid-glass in styles.css).
//
// The look is refraction, not just blur: near the edges the glass bends what's
// behind it, and it bends red, green and blue by slightly different amounts,
// so edges pick up a faint chromatic fringe. That's an SVG filter applied as a
// backdrop-filter:
//
//   1. a displacement map: red ramps across x and green down y, flat (no
//      shift) in the middle and steep at the rim, so only the edges bend;
//   2. the backdrop displaced three times at three strengths, keeping one
//      colour channel from each, then screened back together.
//
// Only Chromium renders url() inside backdrop-filter; elsewhere the glass
// stays the frosted blur. We tag <html> with .lg-refract when it works.

const MAP = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' preserveAspectRatio='none'>` +
    `<defs>` +
    `<linearGradient id='x' x1='0' x2='1' y1='0' y2='0'>` +
    `<stop offset='0' stop-color='rgb(0,0,0)'/><stop offset='0.16' stop-color='rgb(128,0,0)'/>` +
    `<stop offset='0.84' stop-color='rgb(128,0,0)'/><stop offset='1' stop-color='rgb(255,0,0)'/>` +
    `</linearGradient>` +
    `<linearGradient id='y' x1='0' x2='0' y1='0' y2='1'>` +
    `<stop offset='0' stop-color='rgb(0,0,0)'/><stop offset='0.3' stop-color='rgb(0,128,0)'/>` +
    `<stop offset='0.7' stop-color='rgb(0,128,0)'/><stop offset='1' stop-color='rgb(0,255,0)'/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width='200' height='200' fill='url(%23x)'/>` +
    `<rect width='200' height='200' fill='url(%23y)' style='mix-blend-mode:screen'/>` +
    `</svg>`,
);

const CHANNELS = [
  { scale: -26, keep: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", id: "r" },
  { scale: -22, keep: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", id: "g" },
  { scale: -18, keep: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", id: "b" },
];

export function LiquidGlassDefs() {
  useEffect(() => {
    // Chromium (Chrome, Edge, Arc, Brave…): has window.chrome. Safari and
    // Firefox parse url() in backdrop-filter but don't render it.
    const chromium = typeof window !== "undefined" && "chrome" in window;
    if (!chromium) return;
    document.documentElement.classList.add("lg-refract");
    return () => document.documentElement.classList.remove("lg-refract");
  }, []);

  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <filter
        id="liquid-glass"
        x="0"
        y="0"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={`data:image/svg+xml,${MAP}`}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          result="map"
        />
        {CHANNELS.map((c) => (
          <Fragment key={c.id}>
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={c.scale}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`d${c.id}`}
            />
            <feColorMatrix in={`d${c.id}`} type="matrix" values={c.keep} result={c.id} />
          </Fragment>
        ))}
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" />
      </filter>
    </svg>
  );
}
