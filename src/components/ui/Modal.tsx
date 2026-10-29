import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { IconButton } from "@/components/ui/Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  className?: string;
  panelClassName?: string;
  hideClose?: boolean;
}

const sizes = {
  sm: "sm:max-w-[440px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[760px]",
  xl: "sm:max-w-[1040px]",
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Диалог с фокус-ловушкой, Escape и возвратом фокуса.
 * На телефоне открывается как нижний лист. onClose хранится в ref,
 * поэтому инлайн-обработчики родителя не сбрасывают фокус при каждом рендере.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = "md",
  footer,
  className,
  panelClassName,
  hideClose = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => panelRef.current?.focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const hasHeader = Boolean(title || description);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[170] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-scrim/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onCloseRef.current()}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-raised outline-none sm:max-h-[88vh] sm:rounded-2xl",
              sizes[size],
              panelClassName,
              className,
            )}
          >
            {hasHeader ? (
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  {title ? (
                    <h2 className="font-display text-xl font-semibold leading-snug tracking-[-0.015em] text-fg">
                      {title}
                    </h2>
                  ) : null}
                  {description ? <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p> : null}
                </div>
                {!hideClose ? (
                  <IconButton icon="close" label={tr("Закрыть")} size="sm" className="-mr-1.5 -mt-0.5" onClick={() => onCloseRef.current()} />
                ) : null}
              </div>
            ) : !hideClose ? (
              <IconButton
                icon="close"
                label={tr("Закрыть")}
                variant="media"
                size="sm"
                className="absolute right-3 top-3 z-20"
                onClick={() => onCloseRef.current()}
              />
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            {footer ? <div className="shrink-0 border-t border-line bg-surface px-5 py-4 sm:px-6">{footer}</div> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
