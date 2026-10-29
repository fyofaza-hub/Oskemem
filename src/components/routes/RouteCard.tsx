import { Link } from "react-router-dom";
import type { Route } from "@/types";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/context/ToastContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { durationLabel, pluralizeStops } from "@/lib/utils";
import { tr } from "@/i18n/runtime";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/Button";

interface RouteCardProps {
  route: Route;
  variant?: "default" | "compact";
}

export function RouteCard({ route, variant = "default" }: RouteCardProps) {
  const { getUser, savedRouteIds, toggleSaveRoute } = useApp();
  const { toast } = useToast();
  const requireAuth = useRequireAuth();
  const author = getUser(route.authorId);
  const saved = savedRouteIds.includes(route.id);

  const handleSave = () => {
    requireAuth(() => {
      toggleSaveRoute(route.id);
      toast({
        title: saved ? tr("Маршрут убран из сохранённых") : tr("Маршрут сохранён"),
        description: route.title,
        variant: saved ? "info" : "success",
      });
    });
  };

  const saveButton = (
    <IconButton
      icon="bookmark"
      label={saved ? tr("Убрать маршрут из сохранённых") : tr("Сохранить маршрут")}
      size="sm"
      active={saved}
      onClick={handleSave}
      className="pointer-events-auto relative z-10"
    />
  );

  if (variant === "compact") {
    return (
      <article className="card group relative flex items-center gap-3 p-3 transition-colors hover:border-line-strong">
        <Link
          to={`/routes/${route.id}`}
          className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={tr("Открыть маршрут") + ": " + route.title}
        />
        <img src={route.cover} alt="" className="pointer-events-none h-16 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
        <div className="pointer-events-none min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{route.title}</p>
          <p className="mt-0.5 truncate text-meta text-muted">
            {pluralizeStops(route.stops.length)} · {durationLabel(route.durationMin)}
          </p>
          <p className="mt-0.5 truncate text-meta text-muted">{author?.name ?? tr("Городской маршрут")}</p>
        </div>
        {saveButton}
      </article>
    );
  }

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden">
      <Link
        to={`/routes/${route.id}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={tr("Открыть маршрут") + ": " + route.title}
      />
      <div className="pointer-events-none relative aspect-[16/10] overflow-hidden bg-sunken">
        <img
          src={route.cover}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 ease-smooth group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      <div className="pointer-events-none relative z-0 flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-[17px] font-semibold leading-snug tracking-[-0.01em] text-fg">{route.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{route.description}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={14} />
            {durationLabel(route.durationMin)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="distance" size={14} />
            {route.distanceKm ? `≈ ${route.distanceKm} ${tr("км")}` : tr("пешком")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="location" size={14} />
            {pluralizeStops(route.stops.length)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex min-w-0 items-center gap-2 text-meta text-muted">
            <Avatar user={author} size="xs" />
            <span className="truncate">{author?.name ?? tr("Городской автор")}</span>
          </div>
          {saveButton}
        </div>
      </div>
    </article>
  );
}

export function RouteCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton mt-4 h-3 w-1/2" />
      </div>
    </div>
  );
}
