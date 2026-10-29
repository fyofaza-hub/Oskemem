import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AriaRole,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface ScrollAreaProps {
  children: ReactNode;
  orientation?: "vertical" | "horizontal";
  className?: string;
  viewportClassName?: string;
  trackClassName?: string;
  role?: AriaRole;
  ariaLabel?: string;
  showScrollbar?: boolean;
}

interface ScrollMetrics {
  size: number;
  view: number;
  offset: number;
}

const MIN_THUMB_PERCENT = 12;

export function ScrollArea({
  children,
  orientation = "vertical",
  className,
  viewportClassName,
  trackClassName,
  role,
  ariaLabel,
  showScrollbar = true,
}: ScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ start: number; scroll: number } | null>(null);
  const [metrics, setMetrics] = useState<ScrollMetrics>({ size: 0, view: 0, offset: 0 });

  const update = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    setMetrics(
      orientation === "vertical"
        ? {
            size: element.scrollHeight,
            view: element.clientHeight,
            offset: element.scrollTop,
          }
        : {
            size: element.scrollWidth,
            view: element.clientWidth,
            offset: element.scrollLeft,
          },
    );
  }, [orientation]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    if (element.firstElementChild) resizeObserver.observe(element.firstElementChild);

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(element, { childList: true, subtree: true });

    window.addEventListener("resize", update);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const overflow = metrics.size - metrics.view > 1;
  const thumbPercent = overflow
    ? Math.max(MIN_THUMB_PERCENT, (metrics.view / metrics.size) * 100)
    : 0;
  const maxScroll = metrics.size - metrics.view;
  const offsetPercent =
    maxScroll > 0 ? (metrics.offset / maxScroll) * (100 - thumbPercent) : 0;

  const vertical = orientation === "vertical";

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      start: vertical ? event.clientY : event.clientX,
      scroll: vertical ? viewport.scrollTop : viewport.scrollLeft,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!viewport || !track || !drag) return;

    const trackSize = vertical ? track.clientHeight : track.clientWidth;
    const thumbSize = trackSize * (thumbPercent / 100);
    const freeSpace = trackSize - thumbSize;
    const maxScroll = metrics.size - metrics.view;
    if (freeSpace <= 0 || maxScroll <= 0) return;

    const delta = (vertical ? event.clientY : event.clientX) - drag.start;
    const next = drag.scroll + (delta / freeSpace) * maxScroll;
    if (vertical) {
      viewport.scrollTop = next;
    } else {
      viewport.scrollLeft = next;
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        ref={viewportRef}
        role={role}
        aria-label={ariaLabel}
        onScroll={update}
        className={cn(
          "no-scrollbar min-w-0",
          vertical ? "overflow-y-auto" : "overflow-x-auto",
          viewportClassName,
        )}
      >
        {children}
      </div>
      {overflow && showScrollbar ? (
        <div
          ref={trackRef}
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute rounded-full scrollbar-rail",
            vertical ? "bottom-1 right-0.5 top-1 w-1.5" : "inset-x-1 bottom-0 h-1.5",
            trackClassName,
          )}
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn(
              "scrollbar-thumb pointer-events-auto absolute cursor-grab touch-none rounded-full active:cursor-grabbing",
              vertical ? "inset-x-0" : "inset-y-0",
            )}
            style={
              vertical
                ? { height: `${thumbPercent}%`, top: `${offsetPercent}%` }
                : { left: `${offsetPercent}%`, width: `${thumbPercent}%` }
            }
          />
        </div>
      ) : null}
    </div>
  );
}
