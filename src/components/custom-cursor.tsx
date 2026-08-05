"use client";

import { useEffect, useRef } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { useAppSettings } from "@/hooks/use-app-settings";

// ─── Magnetic Cursor with Dot + Circle ────────────────────
// Inner dot: 6px, follows mouse instantly
// Outer circle: 36px, follows with lerp (smooth delay)
// Magnetic snap: circle is pulled toward the center of interactive elements
// Hover state: circle inverts (mix-blend-difference) and grows on hover

interface CursorState {
  x: number;
  y: number;
  circleX: number;
  circleY: number;
  isHovering: boolean;
  circleSize: number;
  isHidden: boolean;
  /** Element currently hovered; its rect is re-measured each frame. */
  hoverTarget: HTMLElement | null;
}

const DOT_SIZE = 6;
const DEFAULT_CIRCLE_SIZE = 36;
const HOVER_CIRCLE_SIZE = 56;
const MAGNETIC_STRENGTH = 0.3;
const LERP_SPEED = 0.18;

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, [tabindex]:not([tabindex="-1"]), [data-cursor-hover], .cursor-hover';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CursorState>({
    x: -100,
    y: -100,
    circleX: -100,
    circleY: -100,
    isHovering: false,
    circleSize: DEFAULT_CIRCLE_SIZE,
    isHidden: true,
    hoverTarget: null,
  });
  const rafRef = useRef<number>(0);
  const mounted = useMounted();
  // cursorMagneticSnap is stored in site settings but was never read, so the
  // admin toggle had no effect. It is honoured now.
  const { enableCustomCursor, cursorMagneticSnap, loading } = useAppSettings();
  const magneticEnabled = cursorMagneticSnap !== false;

  useEffect(() => {
    // Don't show on touch devices or if disabled in settings
    if (typeof window !== "undefined" && "ontouchstart" in window) return;
    if (loading) return;
    if (!enableCustomCursor) return;

    const dot = dotRef.current;
    const circle = circleRef.current;
    if (!dot || !circle) return;

    const state = stateRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      state.x = e.clientX;
      state.y = e.clientY;
      state.isHidden = false;

      // Dot follows immediately
      dot.style.transform = `translate(${e.clientX - DOT_SIZE / 2}px, ${e.clientY - DOT_SIZE / 2}px)`;
      dot.style.opacity = "1";
      circle.style.opacity = "1";
    };

    const handleMouseEnterInteractive = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (!target) return;
      state.isHovering = true;
      state.circleSize = HOVER_CIRCLE_SIZE;
      // Remember the element, not a one-off rect: the rect is re-measured
      // every frame so the snap tracks the element through scrolling and
      // layout shifts instead of pointing at where it used to be.
      state.hoverTarget = target;
      dot.style.opacity = "0.3";
    };

    const handleMouseLeaveInteractive = (e: Event) => {
      // With nested interactive elements (a button inside a link), leaving the
      // child fires here while the pointer is still inside the parent. Only
      // drop the hover state if we are actually leaving the tracked element.
      if (state.hoverTarget && e.currentTarget !== state.hoverTarget) return;
      state.isHovering = false;
      state.hoverTarget = null;
      state.circleSize = DEFAULT_CIRCLE_SIZE;
      dot.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      state.isHidden = true;
      dot.style.opacity = "0";
      circle.style.opacity = "0";
    };

    // Animation loop for the delayed + magnetic circle
    const animate = () => {
      // Lerp the circle toward the mouse
      state.circleX = lerp(state.circleX, state.x, LERP_SPEED);
      state.circleY = lerp(state.circleY, state.y, LERP_SPEED);

      let finalX = state.circleX;
      let finalY = state.circleY;

      // Magnetic pull toward the hovered element's centre, re-measured each
      // frame so it stays correct while the page scrolls or reflows.
      if (magneticEnabled && state.isHovering && state.hoverTarget) {
        if (state.hoverTarget.isConnected) {
          const rect = state.hoverTarget.getBoundingClientRect();
          const dx = rect.left + rect.width / 2 - state.circleX;
          const dy = rect.top + rect.height / 2 - state.circleY;
          finalX = state.circleX + dx * MAGNETIC_STRENGTH;
          finalY = state.circleY + dy * MAGNETIC_STRENGTH;
        } else {
          // Element was removed from the DOM while hovered (route change,
          // conditional render) — release the snap instead of sticking.
          state.isHovering = false;
          state.hoverTarget = null;
          state.circleSize = DEFAULT_CIRCLE_SIZE;
          dot.style.opacity = "1";
        }
      }

      const halfSize = state.circleSize / 2;
      circle.style.transform = `translate(${finalX - halfSize}px, ${finalY - halfSize}px)`;
      circle.style.width = `${state.circleSize}px`;
      circle.style.height = `${state.circleSize}px`;

      rafRef.current = requestAnimationFrame(animate);
    };

    // Event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Track bound elements in a WeakSet rather than a data attribute, so the
    // marker disappears with the element and never pollutes the DOM.
    const bound = new WeakSet<Element>();

    const bindElement = (el: Element) => {
      if (bound.has(el)) return;
      bound.add(el);
      el.addEventListener("mouseenter", handleMouseEnterInteractive);
      el.addEventListener("mouseleave", handleMouseLeaveInteractive);
    };

    const attachHoverListeners = (root: ParentNode = document.body) => {
      try {
        root.querySelectorAll(INTERACTIVE_SELECTOR).forEach(bindElement);
      } catch {
        /* ignore */
      }
    };

    attachHoverListeners();
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          // Scan the added subtree only. This previously re-scanned the whole
          // parent subtree for every inserted node, which is quadratic on
          // pages that render lists incrementally.
          if (el.matches?.(INTERACTIVE_SELECTOR)) bindElement(el);
          attachHoverListeners(el);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      observer.disconnect();
    };
  }, [enableCustomCursor, magneticEnabled, loading]);

  if (!mounted) return null;

  return (
    <>
      {/* Inner Dot — small, follows instantly, inverts on hover */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none opacity-0"
        style={{
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: "50%",
          backgroundColor: "white",
          mixBlendMode: "difference",
          transition: "opacity 0.3s, transform 0.1s ease-out",
          willChange: "transform",
        }}
      />
      {/* Outer Circle — larger, follows with lerp, inverts on hover */}
      <div
        ref={circleRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none opacity-0"
        style={{
          width: DEFAULT_CIRCLE_SIZE,
          height: DEFAULT_CIRCLE_SIZE,
          borderRadius: "50%",
          border: "1.5px solid white",
          backgroundColor: "transparent",
          mixBlendMode: "difference",
          transition: "opacity 0.3s, width 0.25s ease-out, height 0.25s ease-out",
          willChange: "transform",
        }}
      />
      <style jsx global>{`
        * {
          cursor: none !important;
        }
        @media (pointer: coarse) {
          * {
            cursor: auto !important;
          }
        }
        ::selection {
          background-color: hsl(var(--primary) / 0.3);
        }
      `}</style>
    </>
  );
}
