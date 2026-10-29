import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { LANGUAGES, tr } from "@/i18n/runtime";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const rowClass =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-fg transition-colors hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function MenuRow({ to, icon, label, onClick }: { to: string; icon: IconName; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className={rowClass}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sunken text-muted">
        <Icon name={icon} size={18} />
      </span>
      <span className="flex-1">{label}</span>
      <Icon name="chevronRight" size={16} className="text-faint" />
    </Link>
  );
}

/** Нижний лист «Ещё» на телефоне: все разделы, которых нет в нижней панели, а также язык и тема. */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { currentUser, logout } = useApp();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const close = () => onClose();

  return (
    <Modal open={open} onClose={close} title={tr("Ещё")} size="sm">
      <div className="space-y-5 p-4">
        {currentUser ? (
          <Link
            to="/profile"
            onClick={close}
            className="flex items-center gap-3 rounded-2xl border border-line bg-canvas p-3 transition-colors hover:border-line-strong"
          >
            <Avatar user={currentUser} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold text-fg">{currentUser.name}</span>
              <span className="block truncate text-meta text-muted">@{currentUser.username}</span>
            </span>
            <Icon name="chevronRight" size={16} className="text-faint" />
          </Link>
        ) : (
          <ButtonLink to="/auth" variant="primary" size="lg" icon="user" fullWidth onClick={close}>
            {tr("Войти в аккаунт")}
          </ButtonLink>
        )}

        <nav className="space-y-1" aria-label={tr("Разделы")}>
          <MenuRow to="/plan" icon="plan" label={tr("Куда сходить")} onClick={close} />
          <MenuRow to="/routes" icon="routes" label={tr("Маршруты")} onClick={close} />
          <MenuRow to="/events" icon="events" label={tr("События")} onClick={close} />
          <MenuRow to="/profile?tab=favorites" icon="heart" label={tr("Избранное")} onClick={close} />
          {currentUser ? (
            <MenuRow to="/profile" icon="user" label={tr("Профиль")} onClick={close} />
          ) : null}
        </nav>

        <div className="space-y-2 border-t border-line pt-4">
          <p className="field-label">{tr("Язык интерфейса")}</p>
          <div className="segmented w-full">
            {LANGUAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === language}
                onClick={() => {
                  close();
                  setLanguage(item.id);
                }}
                className={cn("segmented-item flex-1", item.id === language && "segmented-item-active")}
              >
                {item.short}
              </button>
            ))}
          </div>

          <p className="field-label pt-2">{tr("Тема оформления")}</p>
          <div className="segmented w-full">
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={cn("segmented-item flex-1 gap-1.5", theme === "light" && "segmented-item-active")}
            >
              <Icon name="sun" size={15} />
              {tr("Светлая")}
            </button>
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={cn("segmented-item flex-1 gap-1.5", theme === "dark" && "segmented-item-active")}
            >
              <Icon name="moon" size={15} />
              {tr("Тёмная")}
            </button>
          </div>
        </div>

        {currentUser ? (
          <button
            type="button"
            onClick={() => {
              logout();
              close();
              navigate("/auth");
              toast({ title: tr("Вы вышли из профиля"), variant: "info" });
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-danger-ink transition-colors hover:bg-danger-soft"
          >
            <Icon name="logout" size={16} />
            {tr("Выйти")}
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
