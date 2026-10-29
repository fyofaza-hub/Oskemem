import { Link, useLocation } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { UserMenu } from "@/components/layout/UserMenu";
import { VoiceSearchButton } from "@/components/search/VoiceSearch";

const sections: Array<{ match: (path: string) => boolean; label: string }> = [
  { match: (path) => path === "/", label: tr("Главная") },
  { match: (path) => path.startsWith("/plan"), label: tr("Куда сходить") },
  { match: (path) => path.startsWith("/guide"), label: tr("Гид") },
  { match: (path) => path === "/routes/new", label: tr("Новый маршрут") },
  { match: (path) => path.startsWith("/routes"), label: tr("Маршруты") },
  { match: (path) => path.startsWith("/map"), label: tr("Карта") },
  { match: (path) => path.startsWith("/events"), label: tr("События") },
  { match: (path) => path.startsWith("/feed"), label: tr("Лента") },
  { match: (path) => path.startsWith("/profile"), label: tr("Профиль") },
  { match: (path) => path.startsWith("/navigation"), label: tr("Навигация по сайту") },
  { match: (path) => path.startsWith("/auth"), label: tr("Вход") },
];

interface TopbarProps {
  onSearch: () => void;
}

export function Topbar({ onSearch }: TopbarProps) {
  const location = useLocation();
  const { currentUser } = useApp();
  const { isLight, toggleTheme } = useTheme();
  const section = sections.find((item) => item.match(location.pathname));
  const title = section?.label ?? tr("Oskemen Culture");

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
        <div className="min-w-0 flex-1 lg:flex-none">
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-fg lg:text-base">{title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onSearch}
            aria-label={tr("Открыть поиск")}
            title={tr("Поиск")}
            className="group hidden h-10 w-64 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-left text-sm text-faint shadow-card transition-colors duration-200 hover:border-line-strong hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:flex xl:w-72"
          >
            <span className="flex-1 truncate">{tr("Найти место, событие или маршрут")}</span>
            <span className="kbd">Ctrl K</span>
          </button>
          <VoiceSearchButton />

          <IconButton icon="search" label={tr("Открыть поиск")} className="lg:hidden" onClick={onSearch} />

          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          <IconButton
            icon={isLight ? "moon" : "sun"}
            label={isLight ? tr("Включить тёмную тему") : tr("Включить светлую тему")}
            onClick={toggleTheme}
            className="hidden lg:inline-flex"
          />

          {currentUser ? (
            <div className="hidden lg:block">
              <UserMenu />
            </div>
          ) : (
            <ButtonLink to="/auth" variant="primary" size="sm" className="hidden lg:inline-flex">
              {tr("Войти")}
            </ButtonLink>
          )}

          <Link
            to={currentUser ? "/profile" : "/auth"}
            aria-label={currentUser ? tr("Профиль") : tr("Войти")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-sunken lg:hidden",
              !currentUser && "text-muted",
            )}
          >
            {currentUser ? (
              <Avatar user={currentUser} size="sm" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line">
                <Icon name="user" size={16} />
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
