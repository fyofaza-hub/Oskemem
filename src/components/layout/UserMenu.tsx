import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { requestTour } from "@/components/onboarding/Onboarding";

const itemClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function MenuLink({ icon, children, ...props }: { icon: IconName } & ComponentProps<typeof Link>) {
  return (
    <Link role="menuitem" className={cn(itemClass, "text-fg hover:bg-sunken")} {...props}>
      <Icon name={icon} size={17} className="text-muted" />
      {children}
    </Link>
  );
}

export function UserMenu() {
  const { currentUser, logout, resetDemo } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!currentUser) return null;

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-10 items-center gap-2 rounded-xl px-1.5 pr-2.5 transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          open && "bg-sunken",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tr("Меню профиля")}
      >
        <Avatar user={currentUser} size="sm" />
        <Icon name="chevronDown" size={14} className="text-faint" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-raised"
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2">
              <Avatar user={currentUser} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{currentUser.name}</p>
                <p className="truncate text-meta text-muted">@{currentUser.username}</p>
              </div>
            </div>
            <div className="border-t border-line py-1.5">
              <MenuLink to="/profile" icon="user" onClick={close}>
                {tr("Мой профиль")}
              </MenuLink>
              <MenuLink to="/profile?tab=favorites" icon="heart" onClick={close}>
                {tr("Избранное")}
              </MenuLink>
              <MenuLink to="/profile?tab=routes" icon="routes" onClick={close}>
                {tr("Мои маршруты")}
              </MenuLink>
              <MenuLink to="/profile?tab=settings" icon="settings" onClick={close}>
                {tr("Настройки профиля")}
              </MenuLink>
            </div>
            <div className="border-t border-line py-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  requestTour();
                  close();
                  navigate("/");
                  toast({
                    title: tr("Обучение запущено"),
                    description: tr("Пройдите шаги — в любой момент можно остановить."),
                    variant: "info",
                  });
                }}
                className={cn(itemClass, "text-fg hover:bg-sunken")}
              >
                <Icon name="guide" size={17} className="text-muted" />
                {tr("Пройти обучение заново")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  resetDemo();
                  close();
                  navigate("/");
                  toast({
                    title: tr("Данные сброшены"),
                    description: tr("Профиль Алины и исходная подборка снова открыты."),
                  });
                }}
                className={cn(itemClass, "text-fg hover:bg-sunken")}
              >
                <Icon name="refresh" size={17} className="text-muted" />
                {tr("Сбросить данные")}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  logout();
                  close();
                  navigate("/auth");
                  toast({
                    title: tr("Вы вышли из профиля"),
                    description: tr("Можно войти снова или зарегистрировать новый аккаунт."),
                    variant: "info",
                  });
                }}
                className={cn(itemClass, "text-danger-ink hover:bg-danger-soft")}
              >
                <Icon name="logout" size={17} />
                {tr("Выйти")}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
