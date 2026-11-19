import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";

/**
 * Wordmark: glossy grey letters (see .gloss-heading); the sheen sweeps on hover.
 * `reload` (the landing header): the page scrolls up to the top, then does a
 * real load of "/" there, instead of a client-side route change that keeps
 * the scroll position.
 */
export function Logo({ reload = false }: { reload?: boolean }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!reload || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    // Don't let the browser put the old position back after the reload.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const refresh = () => {
      window.scrollTo(0, 0);
      window.location.assign("/"); // also drops any #section from the URL
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.scrollY < 2 || reduce) return refresh();
    // Scroll up, then refresh once at the top (or after 1.2s at most).
    window.scrollTo({ top: 0, behavior: "smooth" });
    const start = performance.now();
    const wait = () => {
      if (window.scrollY < 2 || performance.now() - start > 1200) refresh();
      else requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
  };
  return (
    <Link to="/" onClick={onClick} className="group inline-flex cursor-pointer items-center">
      <span
        className="gloss-heading gloss-hover text-lg font-bold"
        style={{ letterSpacing: "-1px" }}
      >
        Dats off.
      </span>
    </Link>
  );
}
