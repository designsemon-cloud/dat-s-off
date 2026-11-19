import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP scroll effects for the landing page. They add depth and direction
// on top of the framer-motion reveals in primitives.tsx; they never animate
// an element framer already animates (each target is its own wrapper, marked
// with data-fx). All scrubbed to scroll and slow, per foundations/motion.md.
// Skipped entirely under prefers-reduced-motion.
//
//   drift     section headers lag the content a little (parallax depth)
//   wave      the tool tiles settle into line in a wave as the row arrives
//   tilt      the product demo rises off the table and lays flat
//   row-in    the Learn rows slide in from the side they travel to
//   card      every Card rises and settles as it arrives; cards further right
//             in a row start a beat later, so a row lands as a wave
//   float     the mock inside a card drifts against the card (inner parallax)

export function initLandingScrollFx(root: HTMLElement): () => void {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel, root);

    q("[data-fx='drift']").forEach((el) =>
      gsap.fromTo(
        el,
        { y: 18 },
        {
          y: -18,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      ),
    );

    const tiles = q("[data-fx='wave']");
    if (tiles.length) {
      gsap.fromTo(
        tiles,
        { y: 44 },
        {
          y: 0,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: tiles[0].parentElement?.parentElement ?? tiles[0],
            start: "top bottom",
            end: "top 62%",
            scrub: 0.8,
          },
        },
      );
    }

    q("[data-fx='tilt']").forEach((el) =>
      gsap.fromTo(
        el,
        {
          rotateX: 12,
          scale: 0.92,
          y: 36,
          transformPerspective: 1800,
          transformOrigin: "50% 100%",
        },
        {
          rotateX: 0,
          scale: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 98%", end: "top 30%", scrub: 0.8 },
        },
      ),
    );

    q("[data-fx='row-in']").forEach((el) => {
      const dir = Number(el.dataset.dir ?? 1);
      gsap.fromTo(
        el,
        { x: 72 * dir },
        {
          x: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 55%", scrub: 0.8 },
        },
      );
    });

    q("[data-fx='card']").forEach((el) => {
      // 0 for the left column … 1 for the right, measured in the card's grid:
      // later columns start later.
      const col = () => {
        let grid = el.parentElement;
        while (grid && getComputedStyle(grid).display !== "grid") grid = grid.parentElement;
        if (!grid) return 0;
        const g = grid.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (r.left - g.left) / Math.max(1, g.width - r.width)));
      };
      gsap.fromTo(
        el,
        { y: 64, scale: 0.97, transformOrigin: "50% 100%" },
        {
          y: 0,
          scale: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: el,
            start: () => `top ${100 - col() * 8}%`,
            end: () => `top ${66 - col() * 8}%`,
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    q("[data-fx='float']").forEach((el) =>
      gsap.fromTo(
        el,
        { y: 10 },
        {
          y: -10,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      ),
    );
  });

  // Sections change height after load (FAQ answers, topic tabs, images), so
  // re-measure trigger positions when the page does.
  let t: ReturnType<typeof setTimeout> | undefined;
  const ro = new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 200);
  });
  ro.observe(root);

  return () => {
    clearTimeout(t);
    ro.disconnect();
    mm.revert();
  };
}
