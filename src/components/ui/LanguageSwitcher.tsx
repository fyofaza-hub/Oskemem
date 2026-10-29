import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES, tr, type Language } from "@/i18n/runtime";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

interface LanguageSwitcherProps {
  className?: string;
  align?: "left" | "right";
}

/**
 * Названия языков остаются на своём языке: посетитель должен найти свой язык,
 * даже если текущий интерфейс ему не понятен.
 */
export function LanguageSwitcher({ className, align = "right" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = LANGUAGES.find((item) => item.id === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Language) => {
    setOpen(false);
    if (next !== language) setLanguage(next);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-medium text-muted transition-colors duration-200 hover:bg-sunken hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          open && "bg-sunken text-fg",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${tr("Язык интерфейса")}: ${active.label}`}
        title={tr("Сменить язык")}
      >
        <Icon name="globe" size={17} />
        <span className="tabular-nums">{active.short}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            aria-label={tr("Язык интерфейса")}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute top-[calc(100%+6px)] z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-raised",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {LANGUAGES.map((item) => {
              const selected = item.id === language;
              return (
                <li key={item.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => choose(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-accent-soft text-accent-ink" : "text-fg hover:bg-sunken",
                    )}
                  >
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-[12px] text-muted">{item.locale}</span>
                    </span>
                    {selected ? <Icon name="check" size={16} /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
