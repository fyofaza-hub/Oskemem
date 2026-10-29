import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MobileMenu } from "@/components/layout/MobileMenu";

interface Tab {
  label: string;
  to: string;
  icon: IconName;
  exact?: boolean;
}

const tabs: Tab[] = [
  { label: tr("Главная"), to: "/", icon: "home", exact: true },
  { label: tr("Гид"), to: "/guide", icon: "guide" },
  { label: tr("Карта"), to: "/map", icon: "map" },
  { label: tr("Лента"), to: "/feed", icon: "feed" },
];

const menuPrefixes = ["/plan", "/routes", "/events", "/profile", "/auth"];

const tabClass = (active: boolean) =>
  cn(
    "flex h-full flex-1 flex-col items-center justify-center gap-1 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
    active ? "text-fg" : "text-muted",
  );

function TabIcon({ icon, active }: { icon: IconName; active: boolean }) {
  return (
    <span
      className={cn(
        "flex h-7 w-14 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent-soft text-accent-ink" : "text-muted",
      )}
    >
      <Icon name={icon} size={20} />
    </span>
  );
}

export function MobileNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (tab: Tab) =>
    tab.exact ? location.pathname === tab.to : location.pathname === tab.to || location.pathname.startsWith(`${tab.to}/`);
  const menuActive = menuPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label={tr("Мобильная навигация")}
      >
        <ul className="flex h-16 items-stretch">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <li key={tab.to} className="flex flex-1">
                <Link to={tab.to} aria-current={active ? "page" : undefined} className={tabClass(active)}>
                  <TabIcon icon={tab.icon} active={active} />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className={tabClass(menuActive)}
            >
              <TabIcon icon="more" active={menuActive} />
              <span>{tr("Ещё")}</span>
            </button>
          </li>
        </ul>
      </nav>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
