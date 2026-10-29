import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";

/**
 * Единый fallback при ленивой загрузке страниц (React.lazy + Suspense).
 * Оптимистичная высота и ленивые «skeleton» рамки: макет не прыгает при подмене контента.
 */
export function PageLoader({ full = false, className }: { full?: boolean; className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "flex items-center justify-center gap-3",
        full ? "min-h-[100svh]" : "min-h-[60svh]",
        className,
      )}
    >
      <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-r-transparent border-t-accent" />
      <span className="sr-only">{tr("Страница загружается")}</span>
    </div>
  );
}
