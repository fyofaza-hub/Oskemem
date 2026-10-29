import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";

interface NavItem {
  label: string;
  to: string;
  icon: IconName;
  exact?: boolean;
  tab?: string;
}

const primaryNav: NavItem[] = [
  { label: tr("Главная"), to: "/", icon: "home", exact: true },
  { label: tr("Куда сходить"), to: "/plan", icon: "plan" },
  { label: tr("Гид"), to: "/guide", icon: "guide" },
  { label: tr("Карта"), to: "/map", icon: "map" },
  { label: tr("Маршруты"), to: "/routes", icon: "routes" },
  { label: tr("События"), to: "/events", icon: "events" },
  { label: tr("Лента"), to: "/feed", icon: "feed" },
];

const personalNav: NavItem[] = [
  { label: tr("Избранное"), to: "/profile?tab=favorites", icon: "heart", tab: "favorites" },
  { label: tr("Профиль"), to: "/profile", icon: "user" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();
  const { toast } = useToast();
  const search = new URLSearchParams(location.search);

  const isActive = (item: NavItem) => {
    if (item.tab) return location.pathname === "/profile" && search.get("tab") === item.tab;
    if (item.to === "/profile") return location.pathname === "/profile" && !search.get("tab");
    if (item.exact) return location.pathname === item.to;
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.label}
        to={item.to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          active ? "bg-accent-soft text-accent-ink" : "text-muted hover:bg-sunken hover:text-fg",
        )}
      >
        <Icon name={item.icon} size={18} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Logo />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label={tr("Основная навигация")}>
        {primaryNav.map(renderItem)}
        <div className="my-3 border-t border-line" />
        {personalNav.map(renderItem)}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-sunken"
            >
              <Avatar user={currentUser} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg">{currentUser.name}</span>
                <span className="block truncate text-meta text-muted">@{currentUser.username}</span>
              </span>
            </Link>
            <IconButton
              icon="logout"
              label={tr("Выйти из профиля")}
              size="sm"
              onClick={() => {
                logout();
                toast({ title: tr("Вы вышли из профиля"), variant: "info" });
                navigate("/auth");
              }}
            />
          </div>
        ) : (
          <ButtonLink to="/auth" variant="primary" size="md" icon="user" fullWidth>
            {tr("Войти")}
          </ButtonLink>
        )}
      </div>
    </aside>
  );
}
