/**
 * Переключатель тем в духе Bear: аккуратный поповер со списком палитр
 * (светлая + Charcoal / Solarized Dark / Panic Mode / Gotham).
 * Доступность: role="menu", menuitemradio, Escape и клик вне панели закрывают.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Icon, type IconName } from "@/components/ui/Icon";
import { THEME_SWATCHES, useTheme, type Theme } from "@/context/ThemeContext";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface ThemeOption {
  id: Theme;
  label: string;
  icon: IconName;
}

/** Список тем единый для поповера и мобильного меню. */
export const THEME_OPTIONS: ThemeOption[] = [
  { id: "light", label: tr("Светлая"), icon: "sun" },
  { id: "charcoal", label: "Charcoal", icon: "moon" },
  { id: "solarized-dark", label: "Solarized Dark", icon: "moon" },
  { id: "panic-mode", label: "Panic Mode", icon: "moon" },
  { id: "gotham", label: "Gotham", icon: "moon" },
];

interface ThemeSwatchesProps {
  theme: Theme;
  className?: string;
}

/** Три мини-точки палитры: фон, поверхность, акцент. */
export function ThemeSwatches({ theme, className }: ThemeSwatchesProps) {
  const [canvas, surface, accent] = THEME_SWATCHES[theme];
  return (
    <span className={cn("flex shrink-0 items-center -space-x-1", className)} aria-hidden="true">
      <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: canvas }} />
      <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: surface }} />
      <span className="h-4 w-4 rounded-full ring-2 ring-white/20" style={{ background: accent }} />
    </span>
  );
}

/** Кнопка-триггер + поповер выбора темы. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Клик вне панели и Escape закрывают; событие не уходит в другие обработчики (модалки и т.п.)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelectorAll("button")[0]?.focus();
  }, [open]);

  const current = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={tr("Сменить тему")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="icon-btn icon-btn-bordered"
      >
        <Icon name={current.icon} size={17} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={tr("Сменить тему")}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[240px] overflow-hidden rounded-2xl border border-line bg-surface/95 p-1.5 shadow-raised backdrop-blur-xl"
          >
            {THEME_OPTIONS.map((option) => {
              const active = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm font-medium transition-colors duration-200",
                    active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-sunken hover:text-fg",
                  )}
                >
                  <ThemeSwatches theme={option.id} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? <Icon name="check" size={15} /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
