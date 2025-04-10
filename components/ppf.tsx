"use client";

import { SVGArc } from "#/components/ui/svg-arc";
import { debounced, throttled } from "#/lib/scheduling";
import {
  type Point,
  degToRad,
  getDirectionInRadians,
  getUnitVector,
  isPointInArc,
  radToDeg,
} from "#/lib/trig";
import { useRouter } from "next/navigation";
import { type RefObject, useCallback, useEffect, useRef } from "react";

type MouseMovementHistory = Point[];

type ProbeRegion = {
  origin: Point;
  direction: number;
};

const InitialProbeRegion: ProbeRegion = {
  origin: { x: 0, y: 0 },
  direction: 0,
};

type PrefetchProviderProps = {
  /** Distance upto which links are fetched from the mouse origin */
  proximity?: number;
  /** Coverage in degrees */
  coverage?: number;
  /** Whether to show the probe area on the screen */
  showProbeArea?: boolean;
};

export function PPFPlugin({
  proximity = 250,
  coverage = 60,
  showProbeArea = false,
}: PrefetchProviderProps) {
  const router = useRouter();

  const probeRegionRef = useRef<ProbeRegion>(InitialProbeRegion);
  const probeAreaRef = useRef<SVGSVGElement | null>(null);

  // Caches the list of links inside the viewport.
  const linksRef = useRef<HTMLAnchorElement[]>([]);

  const updateLinks = useCallback(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a[href]"),
    );
    linksRef.current = links.filter((link) => {
      const rect = link.getBoundingClientRect();
      return (
        rect.top > 0 &&
        rect.top < window.innerHeight &&
        rect.left > 0 &&
        rect.left < window.innerWidth
      );
    });
  }, []);

  const prefetch = useCallback(() => {
    const coverageInRad = degToRad(coverage);
    const { origin, direction } = probeRegionRef.current;
    const startAngle = direction - coverageInRad / 2;
    const endAngle = direction + coverageInRad / 2;

    const linksToPrefetch = linksRef.current.filter((link) => {
      const rect = link.getBoundingClientRect();
      const xMid = (rect.left + rect.right) / 2;
      const yMid = (rect.top + rect.bottom) / 2;
      const linkMid = { x: xMid, y: yMid };
      return isPointInArc(linkMid, origin, proximity, startAngle, endAngle);
    });

    for (const link of linksToPrefetch) {
      router.prefetch(link.href);
      link.style.opacity = "0.5";
    }
  }, [router, proximity, coverage]);

  // Cache the initial page links
  useEffect(() => {
    updateLinks();
    // todo: cleanup?
  }, [updateLinks]);

  // Set up mutation observer to listen for new/deleted 'a'
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      updateLinks();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [updateLinks]);

  useEffect(() => {
    const cb = debounced(updateLinks, 100);
    document.addEventListener("scroll", cb.run);
    return () => {
      document.removeEventListener("scroll", cb.run);
      cb.clear();
    };
  }, [updateLinks]);

  const transformArc = useCallback((probeArea: SVGSVGElement) => {
    const { origin, direction } = probeRegionRef.current;
    probeArea.style.transform = `translate(${origin.x}px, ${origin.y}px) rotate(${radToDeg(direction)}deg)`;
  }, []);

  const lastMousePoint = useRef<Point>({ x: 0, y: 0 });

  const updateState = useCallback(
    (x: number, y: number, probeRegionRef: RefObject<ProbeRegion>) => {
      const origin = { x, y };

      const directionVector = {
        x: origin.x - lastMousePoint.current.x,
        y: origin.y - lastMousePoint.current.y,
      };
      const unitDirectionVector = getUnitVector(directionVector);

      const direction = getDirectionInRadians(unitDirectionVector);
      probeRegionRef.current = { origin, direction };

      lastMousePoint.current = origin;
    },
    [],
  );

  useEffect(() => {
    const cb = throttled(
      (event: MouseEvent) =>
        updateState(event.clientX, event.clientY, probeRegionRef),
      10,
      1,
    );

    window.addEventListener("mousemove", cb.run);
    return () => {
      window.removeEventListener("mousemove", cb.run);
      // todo: revert refs to last values instead of reverting them to their initial values.
      probeRegionRef.current = InitialProbeRegion;
    };
  }, [updateState]);

  // Queue an arc drawing when mouse moves.
  useEffect(() => {
    // Update mouse position on mousemove
    const probeArea = probeAreaRef.current;
    if (probeArea === null) return;

    let raf: number | null = null;

    function queueArcDrawing() {
      if (raf !== null || !probeArea) return;

      raf = requestAnimationFrame(() => {
        transformArc(probeArea);
        raf = null;
      });
    }

    window.addEventListener("mousemove", queueArcDrawing);
    return () => {
      window.removeEventListener("mousemove", queueArcDrawing);
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
    };
  }, [transformArc]);

  // Attach prefetch to mousemove
  useEffect(() => {
    const cb = throttled(prefetch, 100, 1);
    window.addEventListener("mousemove", cb.run);
    return () => {
      window.removeEventListener("mousemove", cb.run);
      cb.clear();
    };
  }, [prefetch]);

  return (
    <>
      {showProbeArea && (
        <SVGArc
          ref={probeAreaRef}
          cx={proximity}
          cy={proximity}
          radius={proximity}
          startAngle={-degToRad(coverage) / 2}
          endAngle={degToRad(coverage) / 2}
          className="fixed pointer-events-none transition-transform duration-[50ms] ease-linear"
          // Center the arc's origin to mouse's origin
          style={{
            left: `${-proximity}px`,
            top: `${-proximity}px`,
          }}
        />
      )}
    </>
  );
}
